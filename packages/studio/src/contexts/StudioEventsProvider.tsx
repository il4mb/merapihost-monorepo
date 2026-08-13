"use client";
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useEffect, useState } from "react";
import { useGlobalKeyListener } from "./GlobalKeyListenerProvider";

// ----------------------------------------------------------------------
// Global Event Type Definitions & Augmentation
// ----------------------------------------------------------------------

export interface DefaultStudioEventMap {
    [event: string]: {
        payload: any;
        result: any;
    };
}

declare global {
    // Users can merge into this interface from anywhere in the codebase using declaration merging
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface StudioEventMap extends DefaultStudioEventMap { }
}

export type StudioEventName = keyof StudioEventMap;
export type StudioEventPayload<T extends StudioEventName> = StudioEventMap[T]["payload"];
export type StudioEventResult<T extends StudioEventName> = StudioEventMap[T]["result"];

export type EventPhase = "before" | "after";
export type EventStatus = "idle" | "running" | "completed" | "failed" | "cancelled";

export interface StudioEventContext<TEvent extends StudioEventName = StudioEventName> {
    name: TEvent;
    payload: StudioEventPayload<TEvent>;
    result?: StudioEventResult<TEvent>;
    defaultPrevented: boolean;
    status: EventStatus;
    preventDefault(): void;
    setPayload(updater: StudioEventPayload<TEvent> | ((prev: StudioEventPayload<TEvent>) => StudioEventPayload<TEvent>)): void;
    setResult(result: StudioEventResult<TEvent>): void;
    setStatus(status: EventStatus): void;
}

type StudioEventListener<TEvent extends StudioEventName = StudioEventName> = (
    context: StudioEventContext<TEvent>
) => void | Promise<void> | StudioEventResult<TEvent> | Promise<StudioEventResult<TEvent>>;

interface StudioListenerEntry {
    id: string;
    callback: StudioEventListener<any>;
    priority: number;
}

interface ShortcutConfig {
    keys: string[];
    description?: string;
}

type StudioEventRegistry = {
    before: StudioListenerEntry[];
    action?: StudioEventListener<any>;
    after: StudioListenerEntry[];
    shortcut?: ShortcutConfig;
};

export interface StudioEventsContextType {
    on<TEvent extends StudioEventName>(
        event: TEvent,
        phase: EventPhase,
        callback: StudioEventListener<TEvent>,
        options?: { priority?: number }
    ): () => void;

    setAction<TEvent extends StudioEventName>(
        event: TEvent,
        callback: StudioEventListener<TEvent>,
        shortcut?: ShortcutConfig
    ): () => void;

    fireEvent<TEvent extends StudioEventName>(
        event: TEvent,
        initialPayload: StudioEventPayload<TEvent>
    ): Promise<{
        defaultPrevented: boolean;
        payload: StudioEventPayload<TEvent>;
        result?: StudioEventResult<TEvent>;
        status: EventStatus;
    }>;

    registerShortcut<TEvent extends StudioEventName>(
        event: TEvent,
        shortcut: ShortcutConfig
    ): () => void;

    unregisterShortcut<TEvent extends StudioEventName>(event: TEvent): void;

    // Event status tracking
    getEventStatus<TEvent extends StudioEventName>(event: TEvent): EventStatus;
    getRunningEvents(): StudioEventName[];
    isEventRunning<TEvent extends StudioEventName>(event: TEvent): boolean;
    waitForEvent<TEvent extends StudioEventName>(
        event: TEvent,
        timeout?: number
    ): Promise<{
        status: EventStatus;
        result?: StudioEventResult<TEvent>;
        payload?: StudioEventPayload<TEvent>;
    }>;
}

const Context = createContext<StudioEventsContextType | undefined>(undefined);

type StudioEventsProviderProps = {
    children: ReactNode;
};

export default function StudioEventsProvider({ children }: StudioEventsProviderProps) {
    const registryRef = useRef<Map<string, StudioEventRegistry>>(new Map());
    const { registerShortcuts } = useGlobalKeyListener();

    // Event status tracking
    const [eventStatuses, setEventStatuses] = useState<Map<string, EventStatus>>(new Map());
    const eventResolversRef = useRef<Map<string, Array<(value: any) => void>>>(new Map());


    const getOrCreateRegistry = (event: string): StudioEventRegistry => {
        if (!registryRef.current.has(event)) {
            registryRef.current.set(event, { before: [], after: [] });
        }
        return registryRef.current.get(event)!;
    };

    // Update event status and notify waiters
    const updateEventStatus = useCallback((event: string, status: EventStatus) => {
        setEventStatuses(prev => {
            const newMap = new Map(prev);
            newMap.set(event, status);
            return newMap;
        });

        // Resolve any waiting promises
        const resolvers = eventResolversRef.current.get(event);
        if (resolvers) {
            const result = {
                status,
                // You might want to include more data here
            };
            resolvers.forEach(resolve => resolve(result));
            eventResolversRef.current.delete(event);
        }
    }, []);

    // Helper to update shortcut registration
    const updateShortcutRegistration = useCallback((event: string) => {
        const registry = registryRef.current.get(event);
        if (!registry) return;

        // Re-register all shortcuts
        const allRegistries = Array.from(registryRef.current.entries());
        const shortcutHandlers: { keys: string[]; action: (event: KeyboardEvent, pressedKeys: string[]) => void }[] = [];

        for (const [eventName, reg] of allRegistries) {
            if (reg.shortcut && reg.action) {
                shortcutHandlers.push({
                    keys: reg.shortcut.keys,
                    action: (keyEvent: KeyboardEvent, pressedKeys: string[]) => {
                        // Fire the event when shortcut is triggered
                        const payload = {} as any;
                        reg.action?.({
                            name: eventName as any,
                            payload,
                            defaultPrevented: false,
                            status: "idle",
                            preventDefault() {
                                keyEvent.preventDefault();
                            },
                            setPayload(updater) {
                                // Handle payload update if needed
                            },
                            setResult(result) {
                                // Handle result if needed
                            },
                            setStatus(status: EventStatus) {
                                updateEventStatus(eventName, status);
                            }
                        } as any);
                    }
                });
            }
        }

        if (shortcutHandlers.length > 0) {
            shortcutHandlers.forEach(({ keys, action }) => {
                registerShortcuts([{ keys, action }]);
            });
        }
    }, [registerShortcuts, updateEventStatus]);

    const on = useCallback(
        <TEvent extends StudioEventName>(
            event: TEvent,
            phase: EventPhase,
            callback: StudioEventListener<TEvent>,
            options?: { priority?: number }
        ) => {
            const registry = getOrCreateRegistry(event as string);
            const id = Math.random().toString(36).substring(2, 9);
            const entry: StudioListenerEntry = {
                id,
                callback,
                priority: options?.priority ?? 0,
            };

            const list = registry[phase];
            list.push(entry);
            list.sort((a, b) => b.priority - a.priority);

            return () => {
                const reg = registryRef.current.get(event as string);
                if (reg) {
                    reg[phase] = reg[phase].filter((item) => item.id !== id);
                    if (reg.before.length === 0 && reg.after.length === 0 && !reg.action) {
                        registryRef.current.delete(event as string);
                        // Clean up status tracking
                        setEventStatuses(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(event as string);
                            return newMap;
                        });
                    }
                }
            };
        },
        []
    );

    const setAction = useCallback(
        <TEvent extends StudioEventName>(
            event: TEvent,
            callback: StudioEventListener<TEvent>,
            shortcut?: ShortcutConfig
        ) => {
            const registry = getOrCreateRegistry(event as string);
            registry.action = callback;

            if (shortcut) {
                registry.shortcut = shortcut;
                updateShortcutRegistration(event as string);
            }

            return () => {
                const reg = registryRef.current.get(event as string);
                if (reg && reg.action === callback) {
                    reg.action = undefined;
                    if (shortcut) {
                        reg.shortcut = undefined;
                        updateShortcutRegistration(event as string);
                    }
                    if (reg.before.length === 0 && reg.after.length === 0) {
                        registryRef.current.delete(event as string);
                        setEventStatuses(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(event as string);
                            return newMap;
                        });
                    }
                }
            };
        },
        [updateShortcutRegistration]
    );

    const registerShortcut = useCallback(
        <TEvent extends StudioEventName>(
            event: TEvent,
            shortcut: ShortcutConfig
        ) => {
            const registry = getOrCreateRegistry(event as string);
            registry.shortcut = shortcut;
            updateShortcutRegistration(event as string);

            return () => {
                const reg = registryRef.current.get(event as string);
                if (reg) {
                    reg.shortcut = undefined;
                    updateShortcutRegistration(event as string);
                }
            };
        },
        [updateShortcutRegistration]
    );

    const unregisterShortcut = useCallback(
        <TEvent extends StudioEventName>(event: TEvent) => {
            const reg = registryRef.current.get(event as string);
            if (reg) {
                reg.shortcut = undefined;
                updateShortcutRegistration(event as string);
            }
        },
        [updateShortcutRegistration]
    );

    const fireEvent = useCallback(
        async <TEvent extends StudioEventName>(
            event: TEvent,
            initialPayload: StudioEventPayload<TEvent>
        ) => {
            const eventKey = event as string;
            const registry = registryRef.current.get(eventKey);

            let currentPayload = (initialPayload !== undefined ? initialPayload : {}) as StudioEventPayload<TEvent>;
            let currentResult: StudioEventResult<TEvent> | undefined = undefined;
            let isPrevented = false;
            let currentStatus: EventStatus = "idle";

            // Update status to running
            updateEventStatus(eventKey, "running");
            currentStatus = "running";

            const context: StudioEventContext<TEvent> = {
                name: event,
                get payload() {
                    return currentPayload;
                },
                get result() {
                    return currentResult;
                },
                get defaultPrevented() {
                    return isPrevented;
                },
                get status() {
                    return currentStatus;
                },
                preventDefault() {
                    isPrevented = true;
                },
                setPayload(updater) {
                    if (typeof updater === "function") {
                        currentPayload = (updater as Function)(currentPayload);
                    } else {
                        currentPayload = updater;
                    }
                },
                setResult(result: StudioEventResult<TEvent>) {
                    currentResult = result;
                },
                setStatus(status: EventStatus) {
                    currentStatus = status;
                    updateEventStatus(eventKey, status);
                },
            };

            if (!registry) {
                console.warn(`No listeners or actions registered for event: ${eventKey}`);
                updateEventStatus(eventKey, "completed");
                return {
                    defaultPrevented: false,
                    payload: currentPayload,
                    status: "completed" as EventStatus
                };
            }

            try {
                // Execute before hooks
                for (const entry of registry.before) {
                    await entry.callback(context);
                    if (isPrevented) {
                        currentStatus = "cancelled";
                        updateEventStatus(eventKey, "cancelled");
                        break;
                    }
                }

                // Execute action if not prevented
                if (!isPrevented && registry.action) {
                    try {
                        const actionResult = await registry.action(context);
                        if (actionResult !== undefined && currentResult === undefined) {
                            currentResult = actionResult as StudioEventResult<TEvent>;
                        }
                        currentStatus = "completed";
                        updateEventStatus(eventKey, "completed");
                    } catch (error) {
                        currentStatus = "failed";
                        updateEventStatus(eventKey, "failed");
                        console.error(`Error in action for event '${eventKey}':`, error);
                        throw error;
                    }
                }

                // Execute after hooks
                for (const entry of registry.after) {
                    await entry.callback(context);
                }

                // Final status update if still running
                if (currentStatus === "running") {
                    currentStatus = "completed";
                    updateEventStatus(eventKey, "completed");
                }

            } catch (error) {
                currentStatus = "failed";
                updateEventStatus(eventKey, "failed");
                console.error(`Error handling event '${eventKey}':`, error);
                throw error;
            }

            return {
                defaultPrevented: isPrevented,
                payload: currentPayload,
                result: currentResult,
                status: currentStatus,
            };
        },
        [updateEventStatus]
    );

    // Event status query methods
    const getEventStatus = useCallback(<TEvent extends StudioEventName>(event: TEvent): EventStatus => {
        return eventStatuses.get(event as string) || "idle";
    }, [eventStatuses]);

    const getRunningEvents = useCallback((): StudioEventName[] => {
        const running: StudioEventName[] = [];
        eventStatuses.forEach((status, event) => {
            if (status === "running") {
                running.push(event as StudioEventName);
            }
        });
        return running;
    }, [eventStatuses]);

    const isEventRunning = useCallback(<TEvent extends StudioEventName>(event: TEvent): boolean => {
        return getEventStatus(event) === "running";
    }, [getEventStatus]);

    const waitForEvent = useCallback(<TEvent extends StudioEventName>(event: TEvent, timeout?: number): Promise<{
        status: EventStatus;
        result?: StudioEventResult<TEvent>;
        payload?: StudioEventPayload<TEvent>;
    }> => {
        return new Promise((resolve, reject) => {
            const eventKey = event as string;
            const currentStatus = getEventStatus(event);

            // If event is not running or already completed, resolve immediately
            if (currentStatus !== "running") {
                resolve({
                    status: currentStatus,
                });
                return;
            }

            // Set up timeout if specified
            let timeoutId: NodeJS.Timeout | undefined;
            if (timeout) {
                timeoutId = setTimeout(() => {
                    // Clean up resolver
                    const resolvers = eventResolversRef.current.get(eventKey);
                    if (resolvers) {
                        const index = resolvers.indexOf(resolve);
                        if (index !== -1) {
                            resolvers.splice(index, 1);
                        }
                        if (resolvers.length === 0) {
                            eventResolversRef.current.delete(eventKey);
                        }
                    }
                    reject(new Error(`Timeout waiting for event: ${eventKey}`));
                }, timeout);
            }

            // Add resolver
            if (!eventResolversRef.current.has(eventKey)) {
                eventResolversRef.current.set(eventKey, []);
            }
            eventResolversRef.current.get(eventKey)!.push((result) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                resolve(result);
            });
        });
    }, [getEventStatus]);

    const values = useMemo(
        () => ({
            on,
            setAction,
            fireEvent,
            registerShortcut,
            unregisterShortcut,
            getEventStatus,
            getRunningEvents,
            isEventRunning,
            waitForEvent,
        }),
        [on, setAction, fireEvent, registerShortcut, unregisterShortcut, getEventStatus, getRunningEvents, isEventRunning, waitForEvent]
    );

    return <Context.Provider value={values}>{children}</Context.Provider>;
}

export const useStudioEvents = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useStudioEvents must be used within an StudioEventsProvider");
    }
    return context;
};

// ----------------------------------------------------------------------
// Helper Hooks
// ----------------------------------------------------------------------

/**
 * Hook to register an action with automatic cleanup
 */
export function useStudioAction<TEvent extends StudioEventName>(event: TEvent, handler: StudioEventListener<TEvent>, shortcut?: ShortcutConfig) {
    const { setAction } = useStudioEvents();

    useEffect(() => {
        const unregister = setAction(event, handler, shortcut);
        return unregister;
    }, [event, handler, shortcut, setAction]);
}

/**
 * Hook to register a shortcut for an event
 */
export function useStudioShortcut<TEvent extends StudioEventName>(event: TEvent, shortcut: ShortcutConfig) {
    const { registerShortcut, unregisterShortcut } = useStudioEvents();

    useEffect(() => {
        const unregister = registerShortcut(event, shortcut);
        return unregister;
    }, [event, shortcut, registerShortcut, unregisterShortcut]);
}

/**
 * Hook to listen to event phases
 */
export function useStudioEventListener<TEvent extends StudioEventName>(event: TEvent, phase: EventPhase, handler: StudioEventListener<TEvent>, options?: { priority?: number }) {
    const { on } = useStudioEvents();

    useEffect(() => {
        const unregister = on(event, phase, handler, options);
        return unregister;
    }, [event, phase, handler, options, on]);
}

/**
 * Hook to track event status
 */
export function useEventStatus<TEvent extends StudioEventName>(event: TEvent): EventStatus {
    const { getEventStatus } = useStudioEvents();
    const [status, setStatus] = useState<EventStatus>(() => getEventStatus(event));

    useEffect(() => {
        // Poll or listen for status changes
        // You could also use a subscription pattern here
        const interval = setInterval(() => {
            const newStatus = getEventStatus(event);
            if (newStatus !== status) {
                setStatus(newStatus);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [event, getEventStatus, status]);

    return status;
}

/**
 * Hook to wait for an event to complete
 */
export function useEventWaiter<TEvent extends StudioEventName>(event: TEvent, timeout?: number) {

    const { waitForEvent } = useStudioEvents();
    const [result, setResult] = useState<{ status: EventStatus; result?: StudioEventResult<TEvent>; payload?: StudioEventPayload<TEvent>; } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const wait = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await waitForEvent(event, timeout);
            setResult(res);
            return res;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [event, timeout, waitForEvent]);

    return { wait, result, loading, error };
}