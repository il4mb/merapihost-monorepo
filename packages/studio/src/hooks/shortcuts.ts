import type { ShortcutHandler } from "@/types";
import { useMemo, useRef, useEffect } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";

export const useMainShortcutListener = () => {

    const { state, dispatch } = useNodesReducer();
    const selectedRef = useRef(state.selected);

    useEffect(() => {
        selectedRef.current = state.selected;
    }, [state.selected]);

    const handleSave = (e: KeyboardEvent) => {
        console.log("Save action triggered");
        e.preventDefault();
    }

    const handleUndo = (e: KeyboardEvent) => {
        console.log("Undo action triggered");
        e.preventDefault();
    }

    const handleRedo = (e: KeyboardEvent) => {
        console.log("Redo action triggered");
        e.preventDefault();
    }

    const handleReload = (e: KeyboardEvent) => {
        console.warn("Reload is restricted.");
        e.preventDefault();
    }

    const handleDelete = (e: KeyboardEvent) => {
        e.preventDefault();
        const selected = Array.from(selectedRef.current);
        if (selected.length <= 0) return;

        const payload = selected.map(id => ({
            type: "DELETE_NODE",
            payload: id
        }));

        dispatch({
            type: "BULK",
            payload: payload as any
        });
    }

    return useMemo<ShortcutHandler[]>(() => [
        {
            keys: ["Control", "s"],
            preventDefault: true,
            action: handleSave
        },
        {
            keys: ["Delete"],
            preventDefault: true,
            action: handleDelete
        },
        {
            keys: ["Backspace"],
            preventDefault: true,
            action: handleDelete
        },
        {
            keys: ["Control", "Shift", "s"],
            preventDefault: true,
            action: handleSave
        },
        {
            keys: ["Control", "z"],
            preventDefault: true,
            action: handleUndo
        },
        {
            keys: ["Control", "Shift", "z"],
            preventDefault: true,
            action: handleUndo
        },
        {
            keys: ["Control", "y"],
            preventDefault: true,
            action: handleRedo
        },
        {
            keys: ["Control", "Shift", "y"],
            preventDefault: true,
            action: handleRedo
        },
        {
            keys: ["Control", "r"],
            preventDefault: true,
            action: handleReload
        },
        {
            keys: ["Control", "Shift", "r"],
            preventDefault: true,
            action: handleReload
        }
    ], []);
}