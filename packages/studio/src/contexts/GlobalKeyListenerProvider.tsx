"use client";
import { createContext, useEffect, useRef, useCallback, useMemo, useContext } from "react";

export interface ShortcutHandler {
    /** List of keys required to trigger the action (e.g. ["Control", "s"] or ["*"]) */
    keys: string[];
    /** 
     * Callback executed when shortcut matches.
     * @param event The original KeyboardEvent
     * @param pressedKeys Array of all currently pressed keys (normalized)
     */
    action: (event: KeyboardEvent, pressedKeys: string[]) => void;
}

interface ProcessedShortcutHandler extends ShortcutHandler {
    normalizedKeys: string[];
    isGlobalWildcard: boolean;
}

type TheClient = HTMLElement | Window | null | undefined;

type Subscriber = {
    id: number;
    timestamp: number;
    shortcuts: ProcessedShortcutHandler[];
    sticky: boolean;
};

export interface GlobalKeyListenerContextValue {
    registerClient: (client: TheClient) => () => void;
    registerShortcuts: (handlers: ShortcutHandler[], sticky?: boolean) => () => void;
}

const Context = createContext<GlobalKeyListenerContextValue | undefined>(undefined);

type GlobalKeyListenerProviderProps = {
    children?: React.ReactNode;
};

export default function GlobalKeyListenerProvider({ children }: GlobalKeyListenerProviderProps) {
    const subscribersRef = useRef<Subscriber[]>([]);
    const keysRef = useRef<Set<string>>(new Set());
    const subscriberIdCounter = useRef(0);

    // Normalize keys (handle Space bar & Case sensitivity for letter keys)
    const normalizeKey = useCallback((key: string) => {
        if (key === " ") return "Space";
        return key.length === 1 ? key.toLowerCase() : key;
    }, []);

    const clearKeys = useCallback(() => {
        if (keysRef.current.size > 0) {
            keysRef.current.clear();
        }
    }, []);

    const findMatchingHandlers = useCallback((): ProcessedShortcutHandler[] => {
        const subscribers = subscribersRef.current;
        if (subscribers.length === 0) return [];

        const matchedHandlers: ProcessedShortcutHandler[] = [];
        const currentKeysSize = keysRef.current.size;

        for (let s = 0; s < subscribers.length; s++) {
            const subscriber = subscribers[s];
            const shortcuts = subscriber.shortcuts;

            // Loop BACKWARDS through shortcuts to maintain strict LIFO order
            for (let i = shortcuts.length - 1; i >= 0; i--) {
                const handler = shortcuts[i];
                const { normalizedKeys, isGlobalWildcard } = handler;

                // 1. Global wildcard ["*"] matches ANY key press
                if (isGlobalWildcard && currentKeysSize > 0) {
                    matchedHandlers.push(handler);
                    continue;
                }

                // 2. Combination matching using high-performance loop
                if (normalizedKeys.length === currentKeysSize) {
                    let matches = true;
                    for (let k = 0; k < normalizedKeys.length; k++) {
                        const targetKey = normalizedKeys[k];
                        if (targetKey !== "*" && !keysRef.current.has(targetKey)) {
                            matches = false;
                            break;
                        }
                    }

                    if (matches) {
                        matchedHandlers.push(handler);
                    }
                }
            }
        }

        return matchedHandlers;
    }, []);

    const handleKeyDown = useCallback((event: Event) => {
        const e = event as KeyboardEvent;
        const key = normalizeKey(e.key);

        keysRef.current.add(key);

        // Special system key reset
        if (key === "Escape") {
            clearKeys();
            return;
        }

        const handlers = findMatchingHandlers();
        if (handlers.length === 0) return;

        // Lazy snapshot: Allocate key array ONLY if valid handlers were matched
        const currentPressedKeys = Array.from(keysRef.current);

        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            if (e.defaultPrevented) {
                continue; // Skip if default action has already been prevented
            }
            if (!e.repeat) {
                handler.action(e, currentPressedKeys);
            }
        }
    }, [normalizeKey, clearKeys, findMatchingHandlers]);

    const handleKeyUp = useCallback((event: Event) => {
        const e = event as KeyboardEvent;
        const key = normalizeKey(e.key);

        if (keysRef.current.has(key)) {
            keysRef.current.delete(key);
        }
    }, [normalizeKey]);

    // Clear stuck keys on window blur or tab switch
    useEffect(() => {
        const handleReset = () => clearKeys();
        window.addEventListener("blur", handleReset);
        document.addEventListener("visibilitychange", handleReset);
        return () => {
            window.removeEventListener("blur", handleReset);
            document.removeEventListener("visibilitychange", handleReset);
        };
    }, [clearKeys]);

    const registerClient = useCallback((client: TheClient) => {
        if (!client) return () => { };

        client.addEventListener("keydown", handleKeyDown);
        client.addEventListener("keyup", handleKeyUp);

        return () => {
            client.removeEventListener("keydown", handleKeyDown);
            client.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    const sortSubscribers = useCallback(() => {
        subscribersRef.current.sort((a, b) => {
            if (a.sticky !== b.sticky) return a.sticky ? -1 : 1;
            return b.timestamp - a.timestamp;
        });
    }, []);

    const registerShortcuts = useCallback((handlers: ShortcutHandler[], sticky = false) => {
        const id = ++subscriberIdCounter.current;

        // Pre-normalize keys and pre-evaluate wildcards once on registration
        const processedShortcuts: ProcessedShortcutHandler[] = handlers.map((h) => ({
            ...h,
            normalizedKeys: h.keys.map(normalizeKey),
            isGlobalWildcard: h.keys.length === 1 && h.keys[0] === "*",
        }));

        const subscriber: Subscriber = {
            id,
            timestamp: Date.now(),
            shortcuts: processedShortcuts,
            sticky,
        };

        subscribersRef.current.push(subscriber);
        sortSubscribers();

        return () => {
            subscribersRef.current = subscribersRef.current.filter((s) => s.id !== id);
        };
    }, [normalizeKey, sortSubscribers]);

    // Register global listener on mount
    useEffect(() => {
        if (typeof window === "undefined") return;
        return registerClient(window);
    }, [registerClient]);

    const values = useMemo(() => ({
        registerClient,
        registerShortcuts
    }), [registerClient, registerShortcuts]);

    return (
        <Context.Provider value={values}>
            {children}
        </Context.Provider>
    );
}

export const useGlobalKeyListener = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useGlobalKeyListener must be used within a GlobalKeyListenerProvider");
    }
    return context;
};