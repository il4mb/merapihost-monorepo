"use client";
import { StudioEventContext, useStudioEvents } from "@/contexts/StudioEventsProvider";
import { useNodes } from "@/contexts";
import { useCurrentPage } from "@/hooks/usePages";
import { clientApi } from "@/libs/api-client.ts";
import { Button, Tooltip } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

declare global {
    interface StudioEventMap {
        "save": {
            payload: undefined;
            result: boolean;
        };
    }
}

type SaveActionProps = {};

export default function SaveAction({ }: SaveActionProps) {
    const page = useCurrentPage();
    const { setAction, fireEvent } = useStudioEvents();
    const { state, dispatch } = useNodes();;
    const [isSaving, setIsSaving] = useState(false);
    const isRunningRef = useRef(false);
    const isEditing = useMemo(() => state.status === "editing", [state.status]);

    useEffect(() => {
        isRunningRef.current = isSaving;
    }, [isSaving]);

    const saveHandler = useMemo(() => async (context: StudioEventContext<"save">) => {
        if ("preventDefault" in context && context.preventDefault) {
            context.preventDefault();
        }
        try {
            if (!page || !page.id)
                throw new Error("No page is currently open. Cannot save.");
            if (isRunningRef.current)
                throw new Error("Save action is already in progress.");
            if (state.status !== "editing")
                throw new Error("Save action is only allowed in 'editing' mode.");

            setIsSaving(true);
            const nodes = Array.from(state.collection.values()).map(node => node.toJSON());
            const { data: result } = await clientApi.patch(`/api/pages/${page?.id}`, { nodes });
            if (!result.success) {
                throw new Error(result.message || "Failed to save nodes.");
            }
            dispatch({ type: "CLEAR_HISTORY" });
            return true;
        } catch (error: any) {
            enqueueSnackbar(`Error during save: ${error.message}`, { variant: "error" });
            return false;
        } finally {
            // Reset the saving state after a short delay to allow for UI feedback
            setTimeout(() => {
                setIsSaving(false);
            }, 500);
        }

    }, [state.status, state.collection, page?.id]);

    const triggerSave = useCallback(async () => {
        await fireEvent("save", undefined);
    }, [fireEvent]);

    // Register the action with shortcut support
    useEffect(() => {
        const unregister = setAction("save", saveHandler, {
            keys: ["Control", "s"],
            description: "Save the current document"
        });

        return () => {
            unregister?.();
        };
    }, [setAction, saveHandler]);

    if (!isEditing) return null;

    return (
        <Tooltip title="Save (Ctrl+S)" placement="top">
            <Button
                onClick={triggerSave}
                variant="contained"
                color="primary"
                disabled={isSaving}
                loading={isSaving}>
                Save
            </Button>
        </Tooltip>
    );
}