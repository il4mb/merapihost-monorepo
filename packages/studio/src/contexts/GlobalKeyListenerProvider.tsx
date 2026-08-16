"use client";
import { createContext, useEffect, useRef, useCallback, useMemo, useContext } from "react";

export interface ShortcutHandler {
    keys: string[];
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
    const clientRefCounts = useRef<Map<TheClient, number>>(new Map());

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

            for (let i = shortcuts.length - 1; i >= 0; i--) {
                const handler = shortcuts[i];
                const { normalizedKeys, isGlobalWildcard } = handler;

                if (isGlobalWildcard && currentKeysSize > 0) {
                    matchedHandlers.push(handler);
                    continue;
                }

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

        if (key === "Escape") {
            clearKeys();
            return;
        }

        const handlers = findMatchingHandlers();
        if (handlers.length === 0) return;

        const currentPressedKeys = Array.from(keysRef.current);

        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            if (e.defaultPrevented) continue;
            if (!e.repeat) handler.action(e, currentPressedKeys);
        }
    }, [normalizeKey, clearKeys, findMatchingHandlers]);

    const handleKeyUp = useCallback((event: Event) => {
        const e = event as KeyboardEvent;
        const key = normalizeKey(e.key);

        if (keysRef.current.has(key)) {
            keysRef.current.delete(key);
        }
    }, [normalizeKey]);

    // --- HOT RELOAD FIX: Stable Event Wrappers ---
    // Keep a living reference to the latest handlers so the DOM listeners never need to be re-attached
    const nativeHandlersRef = useRef({ handleKeyDown, handleKeyUp });
    useEffect(() => {
        nativeHandlersRef.current = { handleKeyDown, handleKeyUp };
    }, [handleKeyDown, handleKeyUp]);

    // These wrappers are strictly stable. Their memory references never change.
    const stableKeydown = useCallback((e: Event) => nativeHandlersRef.current.handleKeyDown(e), []);
    const stableKeyup = useCallback((e: Event) => nativeHandlersRef.current.handleKeyUp(e), []);
    // ---------------------------------------------

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

        const currentCount = clientRefCounts.current.get(client) || 0;

        if (currentCount === 0) {
            // Use the stable wrappers here
            client.addEventListener("keydown", stableKeydown);
            client.addEventListener("keyup", stableKeyup);
        }

        clientRefCounts.current.set(client, currentCount + 1);

        return () => {
            const count = (clientRefCounts.current.get(client) || 0) - 1;

            if (count <= 0) {
                // Use the exact same stable wrappers here
                client.removeEventListener("keydown", stableKeydown);
                client.removeEventListener("keyup", stableKeyup);
                clientRefCounts.current.delete(client);
            } else {
                clientRefCounts.current.set(client, count);
            }
        };
    }, [stableKeydown, stableKeyup]); // Dependencies are now safely empty/stable

    const sortSubscribers = useCallback(() => {
        subscribersRef.current.sort((a, b) => {
            if (a.sticky !== b.sticky) return a.sticky ? -1 : 1;
            return b.timestamp - a.timestamp;
        });
    }, []);

    const registerShortcuts = useCallback((handlers: ShortcutHandler[], sticky = false) => {
        const id = ++subscriberIdCounter.current;

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