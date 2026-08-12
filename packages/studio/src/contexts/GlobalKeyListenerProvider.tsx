"use client";
import { createContext, useEffect, useRef, useCallback, useMemo, useContext } from "react";
import { nanoid } from "nanoid";

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

type TheClient = HTMLElement | Window | null | undefined;

type Subscriber = {
    id: string;
    timestamp: number;
    shortcuts: ShortcutHandler[];
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
    const handlersRef = useRef<Map<string, Subscriber>>(new Map());
    const keysRef = useRef<Set<string>>(new Set());

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

    const findMatchingHandlers = useCallback((): ShortcutHandler[] => {
        const subscribers = Array.from(handlersRef.current.values());

        // 1. Sort by sticky first, then LIFO (newest timestamp first)
        subscribers.sort((a, b) => {
            if (a.sticky !== b.sticky) return a.sticky ? -1 : 1;
            return b.timestamp - a.timestamp;
        });

        const matchedHandlers: ShortcutHandler[] = [];
        const currentKeysSize = keysRef.current.size;

        for (const subscriber of subscribers) {
            // 2. Loop BACKWARDS through shortcuts to maintain strict LIFO order
            for (let i = subscriber.shortcuts.length - 1; i >= 0; i--) {
                const handler = subscriber.shortcuts[i];
                const normalizedTargetKeys = handler.keys.map(normalizeKey);

                const isGlobalWildcard = normalizedTargetKeys.length === 1 && normalizedTargetKeys[0] === "*";

                // 3. If it's a global wildcard ["*"], it matches ANY key press
                if (isGlobalWildcard && currentKeysSize > 0) {
                    matchedHandlers.push(handler);
                    continue;
                }

                // 4. For combinations (with or without wildcard), check length first
                if (normalizedTargetKeys.length === currentKeysSize) {
                    // Filter out the wildcard character to only check explicit required keys
                    const requiredKeys = normalizedTargetKeys.filter(k => k !== "*");

                    if (requiredKeys.every((k) => keysRef.current.has(k))) {
                        matchedHandlers.push(handler);
                    }
                }
            }
        }

        return matchedHandlers;
    }, [normalizeKey]);

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

        // Snapshot the currently pressed keys to pass to the callback
        const currentPressedKeys = Array.from(keysRef.current);

        for (const handler of handlers) {
            if (e.defaultPrevented) {
                continue; // Skip if default action has already been prevented
            }
            // Prevent OS key auto-repeat continuous triggers
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

    // Handle blur event globally to prevent keys getting "stuck"
    useEffect(() => {
        window.addEventListener("blur", clearKeys);
        return () => window.removeEventListener("blur", clearKeys);
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

    /**
     * Registers a shortcut handler for the global key listener.    
     * @param handlers - An array of shortcut handlers to register.
     * @param sticky - If true, the handler will be always at the top of the stack, when new handlers are registered.
     * @returns A function to unregister the handler.
     */
    const registerShortcuts = useCallback((handlers: ShortcutHandler[], sticky = false) => {
        const id = nanoid();
        const subscriber: Subscriber = { id, timestamp: Date.now(), shortcuts: handlers, sticky };
        handlersRef.current.set(id, subscriber);
        return () => {
            handlersRef.current.delete(id);
        };
    }, []);

    // Register the global key listener on mount and unregister on unmount
    useEffect(() => {
        if (typeof window === "undefined") return;
        const unregister = registerClient(window);
        return unregister;
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