import type { ShortcutHandler } from "@/types";
import { useMemo, useRef, useEffect, useCallback } from "react";
import { useNodes } from "@/contexts";

export const useMainShortcutListener = () => {

    const { state, dispatch } = useNodes();;
    const nodesRef = useRef(state.collection);
    const selectedRef = useRef(state.selected);
    const statusRef = useRef(state.status);

    useEffect(() => {
        selectedRef.current = state.selected;
    }, [state.selected]);

    useEffect(() => {
        statusRef.current = state.status;
    }, [state.status]);

    useEffect(() => {
        nodesRef.current = state.collection;
    }, [state.collection]);

    const handleUndo = useCallback((e: KeyboardEvent) => {
        console.log("Undo action triggered");
        e.preventDefault();
        dispatch({ type: "UNDO" });
    }, []);

    const handleRedo = useCallback((e: KeyboardEvent) => {
        console.log("Redo action triggered");
        e.preventDefault();
        dispatch({ type: "REDO" });
    }, []);

    const handleReload = useCallback((e: KeyboardEvent) => {
        console.warn("Reload is restricted.");
        e.preventDefault();
    }, []);

    const handleDelete = useCallback((e: KeyboardEvent) => {
        e.preventDefault();
        const selected = Array.from(selectedRef.current);
        if (selected.length <= 0) return;
        const selectedNodes = Array.from(nodesRef.current.values())
            .filter(n => selected.includes(n.id) && n.deletable);
        const selectedIds = selectedNodes.map(e => e.id);

        const payload = selectedIds.map(id => ({
            type: "DELETE_NODE",
            payload: id
        }));

        dispatch({
            type: "BULK",
            payload: payload as any
        });
    }, [dispatch]);

    return useMemo<ShortcutHandler[]>(() => [
        {
            keys: ["Delete"],
            action: handleDelete
        },
        {
            keys: ["Backspace"],
            action: handleDelete
        },
        {
            keys: ["Control", "z"],
            action: handleUndo
        },
        {
            keys: ["Control", "Shift", "z"],
            action: handleUndo
        },
        {
            keys: ["Control", "y"],
            action: handleRedo
        },
        {
            keys: ["Control", "Shift", "y"],
            action: handleRedo
        },
        {
            keys: ["Control", "r"],
            action: handleReload
        },
        {
            keys: ["Control", "Shift", "r"],
            action: handleReload
        }
    ], [handleDelete, handleUndo, handleRedo, handleReload]);
}