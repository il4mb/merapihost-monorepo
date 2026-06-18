import { Box } from "@mui/material";
import { useState, KeyboardEvent, useEffect } from "react";

const SHARED_STYLES = {
    outline: "none",
    border: "none",
    background: "transparent",
    fontSize: "12px",
    fontWeight: 400,
    width: "100%",
    fontFamily: "inherit",
    "&:focus": {
        outline: "none",
        border: "none",
    },
    "&:hover": {
        outline: "none",
        border: "none",
    },
};

type LabelFieldProps = {
    value: string;
    onChange?: (newValue: string) => void;
    onFinish?: (value: string) => void;
    onStartEditing?: () => void;
};

export default function LabelField({ value, onChange, onFinish, onStartEditing }: LabelFieldProps) {
    const [editing, setEditing] = useState(false);

    const onDoubleClick = () => {
        setEditing(true);
        onStartEditing?.();
    };

    const onBlur = () => {
        setEditing(false);
        onFinish?.(value);
    };

    // Allows users to press Enter to finish editing
    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setEditing(false);
            onFinish?.(value);
        }
    }

    // Render the active input field
    if (editing) {
        return (
            <Box
                component="input"
                autoFocus
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                sx={SHARED_STYLES}
                type="text"
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
            />
        );
    }

    // Render the read-only span
    return (
        <Box
            component="span"
            onDoubleClick={onDoubleClick}
            sx={{
                ...SHARED_STYLES,
                cursor: "text", // Gives a visual hint that it's editable text
                display: "inline-block", // Ensures it takes up space correctly
            }}>
            {value || "\u00A0"} {/* Fallback for empty strings so it stays clickable */}
        </Box>
    );
}