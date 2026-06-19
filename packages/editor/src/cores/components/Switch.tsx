import { Box, SxProps, Theme } from "@mui/material";
import { memo, useCallback } from "react";

export interface SwitchProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    size?: number;
    color?: string;
    sx?: SxProps<Theme>;
}

const Switch = memo(({
    checked,
    onChange,
    disabled = false,
    size = 13,
    color = "primary.main",
    sx
}: SwitchProps) => {

    const handleToggle = useCallback(() => {
        if (!disabled) {
            onChange?.(!checked);
        }
    }, [checked, disabled, onChange]);

    const trackWidth = size * 2.4;
    const thumbOffset = trackWidth - size - 4;

    return (
        <Box
            component="button"
            type="button"
            role="switch"
            aria-checked={checked}
            aria-disabled={disabled}
            onClick={handleToggle}
            disabled={disabled}
            sx={{
                width: trackWidth,
                height: size + 4,
                border: 0,
                p: "2px",
                borderRadius: 1.5,
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                cursor: disabled ? "not-allowed" : "pointer",
                backgroundColor: disabled
                    ? "grey.300"
                    : checked
                        ? color
                        : "grey.400",
                transition: (theme) =>
                    theme.transitions.create(
                        ["background-color"],
                        { duration: 200 }
                    ),

                "&:focus-visible, &:focus": {
                    outline: "1px solid",
                    outlineColor: (theme) => theme.palette.primary.main,
                    outlineOffset: 1,
                },

                "&:hover": !disabled
                    ? {
                        opacity: 0.9
                    }
                    : undefined,

                "&::before": {
                    content: '""',
                    width: size,
                    height: size,
                    borderRadius: "48%",
                    backgroundColor: "#fff",
                    boxShadow: 1,
                    transform: checked
                        ? `translateX(${thumbOffset}px)`
                        : "translateX(0)",
                    transition: (theme) =>
                        theme.transitions.create(
                            ["transform"],
                            { duration: 200 }
                        ),
                },

                ...sx,
            }}
        />
    );
});

Switch.displayName = "Switch";

export default Switch;