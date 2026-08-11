import type { ShortcutHandler } from "@/types";
import { useMemo, useRef, useEffect } from "react";
import { useStudio } from "@/contexts/StudioProvider";

export const useMainShortcutListener = () => {

    const { state, dispatch } = useStudio();
    const selectedRef = useRef(state.selected);

    useEffect(() => {
        selectedRef.current = state.selected;
    }, [state.selected]);

    const handleSave = () => {
        console.log("Save action triggered");

    }

    const handleUndo = () => {
        console.log("Undo action triggered");
    }

    const handleRedo = () => {
        console.log("Redo action triggered");
    }

    const handleReload = () => {
        console.warn("Reload is restricted.");
    }

    const handleDelete = () => {
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