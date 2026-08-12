"use client";
import { useEffect } from "react";
import type { ShortcutHandler } from "@/types";
import { useGlobalKeyListener } from "@/contexts/GlobalKeyListenerProvider";

export const useRegisterShortcuts = (handlers: ShortcutHandler[] = []) => {
    const { registerShortcuts } = useGlobalKeyListener();
    useEffect(() => {
        const unregister = registerShortcuts(handlers);
        return () => {
            unregister();
        };
    }, [registerShortcuts, handlers]);
};