import type { ShortcutHandler } from "@/types";
import { useMemo } from "react";

export const useMainShortcutListener = () => {


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



    return useMemo<ShortcutHandler[]>(() => [
        {
            keys: ["Control", "s"],
            preventDefault: true,
            action: handleSave
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