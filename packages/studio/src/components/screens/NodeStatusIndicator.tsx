"use client";
import { useNodes } from "@/contexts";
import { Box, Button, Typography } from "@mui/material";
import WindowDialog from "../ui/WindowDialog";
import { PenOff } from "lucide-react";

export default function NodeStatusIndicator() {
    const { state, dispatch } = useNodes();
    const isEditing = state.status === "editing";
    const shouldOpen = !isEditing;

    const handleSwitchToEditingMode = () => {
        dispatch({ type: "SET_STATUS", payload: "editing" });
    };

    if (!shouldOpen) return null;

    return (
        <WindowDialog
            movable
            width={350}
            height={100}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            title={
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", userSelect: "none", color: "warning.main", fontSize: "1rem", display: "flex", alignItems: "center" }}>
                    <PenOff size={16} style={{ marginRight: 8, verticalAlign: "middle" }} />
                    Editing Disabled
                </Typography>
            }
            open={shouldOpen}>
            <Box sx={{ px: 4, py: 2 }}>
                <Typography variant="body1" gutterBottom sx={{ color: "warning.dark" }}>
                    Editing is disabled. Please switch to editing mode to make changes.
                </Typography>
                <Button variant="outlined" color="secondary" onClick={handleSwitchToEditingMode}>
                    Switch to Editing Mode
                </Button>
            </Box>
        </WindowDialog>
    );
}
