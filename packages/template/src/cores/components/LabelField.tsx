import { Box, SxProps, TextareaAutosize } from "@mui/material";
import { useState, KeyboardEvent } from "react";

const SHARED_STYLES = {
    outline: "none",
    border: "none",
    background: "transparent",
    fontSize: "12px",
    fontWeight: 400,
    width: "100%",
    fontFamily: "inherit",
    // Added to ensure the span and textarea match heights and wrapping behavior perfectly
    padding: 0,
    margin: 0,
    lineHeight: 1.5,
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
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
    sx?: SxProps;
};

export default function LabelField({ value, onChange, onFinish, onStartEditing, sx }: LabelFieldProps) {
    const [editing, setEditing] = useState(false);

    const onDoubleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        e.preventDefault();
        setEditing(true);
        onStartEditing?.();
    };

    const onBlur = () => {
        setEditing(false);
        onFinish?.(value);
    };

    // Allows users to press Enter to finish editing
    const onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevents inserting a new line in the textarea
            setEditing(false);
            onFinish?.(value);
        }
    }

    // Render the active auto-sizing textarea
    if (editing) {
        return (
            // @ts-ignore
            <Box
                component={TextareaAutosize}
                autoFocus
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                sx={{
                    ...SHARED_STYLES,
                    resize: "none", // Hides the drag handle
                    overflow: "hidden", // Hides the scrollbar
                    ...sx
                }}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value)}
            />
        );
    }

    // Render the read-only span
    return (
        // @ts-ignore
        <Box
            component="span"
            onDoubleClick={onDoubleClick}
            sx={{
                ...SHARED_STYLES,
                cursor: "text", // Gives a visual hint that it's editable text
                display: "inline-block", // Ensures it takes up space correctly
                ...sx
            }}>
            {value || "\u00A0"} {/* Fallback for empty strings so it stays clickable */}
        </Box>
    );
}