"use client";

import { useEffect, useRef, useCallback } from "react";
import type { ShortcutHandler } from "@/types";

type TheWindow = HTMLElement | Window | null | undefined;
export const useGlobalKeyListener = (element: TheWindow, handlers: ShortcutHandler[] = []) => {
    const keysRef = useRef<Set<string>>(new Set());

    // Normalize keys (handle Space bar & Case sensitivity for letter keys)
    const normalizeKey = (key: string) => {
        if (key === " ") return "Space";
        return key.length === 1 ? key.toLowerCase() : key;
    };

    const clearKeys = useCallback(() => {
        if (keysRef.current.size > 0) {
            keysRef.current.clear();
        }
    }, []);

    const handleKeyDown = useCallback(
        (event: Event) => {
            const e = event as KeyboardEvent;
            const key = normalizeKey(e.key);

            keysRef.current.add(key);

            // Special system key reset
            if (key === "Escape") {
                clearKeys();
                return;
            }

            // Find matching shortcut action
            const matchedHandler = handlers.find((h) => {
                const normalizedTargetKeys = h.keys.map(normalizeKey);

                // Match exact key count and inclusion to prevent Ctrl+S triggering on Ctrl+Shift+S
                return (
                    normalizedTargetKeys.length === keysRef.current.size &&
                    normalizedTargetKeys.every((k) => keysRef.current.has(k))
                );
            });

            if (matchedHandler) {
                if (matchedHandler.preventDefault !== false) {
                    e.preventDefault();
                }

                // Prevent OS key auto-repeat continuous triggers
                if (!e.repeat) {
                    matchedHandler.action(e);
                }
            }
        },
        [handlers, clearKeys]
    );

    const handleKeyUp = useCallback((event: Event) => {
        const e = event as KeyboardEvent;
        const key = normalizeKey(e.key);

        if (keysRef.current.has(key)) {
            keysRef.current.delete(key);
        }
    }, []);

    useEffect(() => {
        if (!element) return;

        element.addEventListener("keydown", handleKeyDown, true);
        element.addEventListener("keyup", handleKeyUp, true);
        window.addEventListener("blur", clearKeys);

        return () => {
            element.removeEventListener("keydown", handleKeyDown, true);
            element.removeEventListener("keyup", handleKeyUp, true);
            window.removeEventListener("blur", clearKeys);
            clearKeys();
        };
    }, [element, handleKeyDown, handleKeyUp, clearKeys]);
};