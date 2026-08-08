import { Box } from "@mui/material";
import { cloneElement, Fragment, ReactElement, useRef, useState } from "react";

type DraggableElementProps = {
    onDrop?: (event: React.DragEvent<HTMLElement>) => void;
    onDragOver?: (event: React.DragEvent<HTMLElement>) => void;
    onDragEnter?: (event: React.DragEvent<HTMLElement>) => void;
    onDragLeave?: (event: React.DragEvent<HTMLElement>) => void;
    ref?: React.Ref<HTMLElement>;
};

type DropOverlayProps = {
    children: ReactElement<DraggableElementProps>;
    customOverlay?: ReactElement;
};

export default function DragAndDropZone({ children, customOverlay }: DropOverlayProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const dragCounter = useRef(0);
    const localRef = useRef<HTMLElement | null>(null);

    // Extract the original ref from the child if it exists
    const originalRef = (children as any).ref;

    // Create a ref callback that updates both our local ref and the original ref
    const mergedRef = (node: HTMLElement | null) => {
        localRef.current = node;

        if (typeof originalRef === "function") {
            originalRef(node);
        } else if (originalRef) {
            originalRef.current = node;
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();

        dragCounter.current = 0;
        setIsDragging(false);
        console.log("Dropped!");

        // Preserve original child's event handler if it had one
        if (children.props.onDrop) children.props.onDrop(event);
    };

    const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (children.props.onDragOver) children.props.onDragOver(event);
    };

    const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        dragCounter.current += 1;

        if (dragCounter.current === 1) {
            // Get the rect directly from the localRef instead of the event target
            if (localRef.current) {
                setRect(localRef.current.getBoundingClientRect());
            }
            setIsDragging(true);
        }

        if (children.props.onDragEnter) children.props.onDragEnter(event);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        dragCounter.current -= 1;

        if (dragCounter.current === 0) {
            setIsDragging(false);
        }

        if (children.props.onDragLeave) children.props.onDragLeave(event);
    };

    return (
        <Fragment>
            {cloneElement(children, {
                ref: mergedRef,
                onDrop: handleDrop,
                onDragOver: handleDragOver,
                onDragEnter: handleDragEnter,
                onDragLeave: handleDragLeave,
            })}

            {customOverlay || (isDragging && rect && (
                <Box
                    sx={{
                        position: "fixed",
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                        backgroundColor: "rgba(0, 0, 0, 0.1)",
                        pointerEvents: "none",
                        zIndex: 9999,
                        border: "2px dashed",
                        borderColor: "primary.main",
                        borderRadius: .15,
                    }}
                />
            ))}
        </Fragment>
    );
}