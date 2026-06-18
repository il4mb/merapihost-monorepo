import { styled, SxProps } from "@mui/material";
import { MoveVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { clamp } from "lodash";

const Container = styled("div")({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    position: "relative",
    cursor: "ns-resize", 
    fontSize: "14px",
    borderRadius: "4px",
    transition: "background-color 0.2s ease",
    "&:focus-visible": {
        outline: "2px solid #ff00f2",
        outlineOffset: "2px",
    },
});

const NumberSpan = styled("span")({
    fontSize: "1em",
    fontWeight: "bold",
    minWidth: "0.3em",
    display: "inline-block",
    color: "#ff00f2",
    userSelect: "none", 
});

const StyledInput = styled("input")({
    fontSize: "1em",
    fontWeight: "bold",
    fieldSizing: "content",
    minWidth: "0.3em",
    padding: "0",
    margin: "0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "inherit",
    fontFamily: "inherit",
    MozAppearance: "textfield",
    "&::-webkit-outer-spin-button, &::-webkit-inner-spin-button": {
        WebkitAppearance: "none",
        margin: 0,
    },
});

const ResizeHandle = styled("div")(({ theme }) => ({
    cursor: "ns-resize",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    left: "-1.6em",
    top: "50%",
    transform: "translateY(-50%)",
    padding: "0.2em 0px",
    borderRadius: ".25em",
    color: theme.palette.primary.main,
    pointerEvents: "none", 
}));

const roundToStepPrecision = (val: number, step: number) => {
    const stepStr = step.toString();
    const precision = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
    // Keep internal precision high (3 decimal places) during drag to avoid snapping too early
    const factor = Math.pow(10, Math.max(precision + 1, 3));
    return Math.round(val * factor) / factor;
};

interface NumberFieldProps {
    value: number;
    onChange: (value: number) => void;
    onInteract?: (interacting: boolean) => void;
    step?: number;
    min?: number;
    max?: number;
    dragSensitivity?: number; // Replaced rangeDragThreshold
    sx?: SxProps;
}

export default function NumberField({
    value,
    onChange,
    onInteract,
    step = 1,
    min = -Infinity,
    max = Infinity,
    dragSensitivity = 1, // 1 pixel of movement = 1 step
    sx
}: NumberFieldProps) {
    const [isInteracting, setIsInteracting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(value.toString());
    const inputRef = useRef<HTMLInputElement | null>(null);

    const initialCursorY = useRef(0);
    const lastCursorY = useRef(0);
    const accumulatedValue = useRef(0);
    const hasDragged = useRef(false);

    useEffect(() => {
        if (!editing) setInputValue(value.toString());
    }, [value, editing]);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const onPointerDown = (e: React.PointerEvent) => {
        if (editing) return;

        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);

        initialCursorY.current = e.clientY;
        lastCursorY.current = e.clientY;
        accumulatedValue.current = value;
        hasDragged.current = false;

        setIsInteracting(true);
        document.body.style.cursor = "ns-resize";
    };

    const onPointerUp = () => {
        if (!isInteracting) return;

        setIsInteracting(false);
        setIsDragging(false);
        onInteract?.(false);
        document.body.style.cursor = "default";

        if (!hasDragged.current) {
            setEditing(true);
        }
    };

    useEffect(() => {
        if (!isInteracting) return;

        const onPointerMove = (e: PointerEvent) => {
            if (!isInteracting) return;

            const currentY = e.clientY;
            const totalDeltaY = currentY - initialCursorY.current;
            const frameDeltaY = lastCursorY.current - currentY; // Inverted: Up is positive

            if (Math.abs(totalDeltaY) > 3) {
                if (!hasDragged.current) {
                    hasDragged.current = true;
                    setIsDragging(true);
                    onInteract?.(true);
                }
            }

            if (hasDragged.current) {
                // 1. Apply keyboard modifiers
                let activeStep = step;
                if (e.shiftKey) activeStep = step * 10; // Fast mode
                else if (e.altKey) activeStep = step * 0.1; // Precision mode

                // 2. Calculate new value based linearly on frame movement
                let newValue = accumulatedValue.current + (frameDeltaY * activeStep * dragSensitivity);

                // 3. Clamp and round
                newValue = clamp(newValue, min, max);
                newValue = roundToStepPrecision(newValue, activeStep);

                accumulatedValue.current = newValue;
                onChange(newValue);
            }

            lastCursorY.current = currentY;
        };

        const onGlobalPointerUp = () => {
            onPointerUp();
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onGlobalPointerUp);

        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onGlobalPointerUp);
        };
    }, [isInteracting, onChange, step, min, max, dragSensitivity]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9.-]/g, '');
        setInputValue(val);
    };

    const handleInputBlur = () => {
        setEditing(false);
        const parsed = parseFloat(inputValue);
        if (!isNaN(parsed)) {
            onChange(clamp(parsed, min, max));
        } else {
            setInputValue(value.toString());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            if ('blur' in e.currentTarget) {
                (e.currentTarget as HTMLInputElement).blur();
            }
        } else if (e.key === "Escape") {
            setEditing(false);
            setInputValue(value.toString());
        }
    };

    const handleContainerKeyDown = (e: React.KeyboardEvent) => {
        if (!editing && e.key === "Enter") {
            e.preventDefault();
            setEditing(true);
        }
    };

    return (
        <Container
            tabIndex={editing ? -1 : 0}
            onKeyDown={handleContainerKeyDown}
            onPointerDown={onPointerDown}
            onDoubleClick={() => setEditing(true)}
            sx={sx}>
            {editing ? (
                <StyledInput
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    style={{ width: `${Math.max(1, inputValue.length) + 0.5}ch` }}
                />
            ) : (
                <NumberSpan>{value}</NumberSpan>
            )}

            {isDragging && (
                <ResizeHandle>
                    <MoveVertical size={'1em'} />
                </ResizeHandle>
            )}
        </Container>
    );
}