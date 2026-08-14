import type { ShortcutHandler } from "@/types";
import { useMemo, useRef, useEffect, useCallback } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";

export const useMainShortcutListener = () => {

    const { state, dispatch } = useNodesReducer();
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

    const handleSave = useCallback((e: KeyboardEvent) => {
        e.preventDefault();
        // Prevent save if not in editing mode
        if (statusRef.current !== "editing") {
            console.warn("Save action is only allowed in 'editing' mode.");
            return;
        }
        const nodes = Array.from(state.collection.values()).map(node => node.toJSON());
        setTimeout(() => {
            console.log("Saving nodes to server:", nodes);
            dispatch({ type: "SET_NODE_STATE_STATUS", payload: "editing" });
        }, 1000);

    }, [state.collection, state.status]);

    const handleUndo = useCallback((e: KeyboardEvent) => {
        console.log("Undo action triggered");
        e.preventDefault();
    }, []);

    const handleRedo = useCallback((e: KeyboardEvent) => {
        console.log("Redo action triggered");
        e.preventDefault();
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
        // {
        //     keys: ["Control", "s"],
        //     preventDefault: true,
        //     action: handleSave
        // },
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
        // {
        //     keys: ["Control", "Shift", "s"],
        //     preventDefault: true,
        //     action: handleSave
        // },
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
    ], [handleSave, handleDelete, handleUndo, handleRedo, handleReload]);
}