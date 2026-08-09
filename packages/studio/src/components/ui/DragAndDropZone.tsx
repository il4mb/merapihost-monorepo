import { Box } from "@mui/material";
import { cloneElement, Fragment, ReactElement, useRef, useState } from "react";

type DraggableElementProps = {
    onDrop?: (event: React.DragEvent<HTMLElement>) => void;
    onDragOver?: (event: React.DragEvent<HTMLElement>) => void;
    onDragEnter?: (event: React.DragEvent<HTMLElement>) => void;
    onDragLeave?: (event: React.DragEvent<HTMLElement>) => void;
    ref?: React.Ref<HTMLElement>;
};

export type DragState = {
    isDragging: boolean;
    isAccepted: boolean;
    rect: DOMRect | null;
    cursorPos: { x: number; y: number } | null;
    hoveredElement: HTMLElement | null;
};

type DropOverlayProps = {
    children: ReactElement<DraggableElementProps>;
    /** Array of accepted mime types or keywords matching `event.dataTransfer.types` (e.g., ['Files', 'text/html']) */
    accepts?: string[];
    /** Custom validation function. Overrides `accepts` array if provided. */
    onValidate?: (event: React.DragEvent<HTMLElement>) => boolean;
    /** Render prop to replace the default overlay with access to real-time drag state */
    customOverlay?: (state: DragState) => ReactElement | null;
};

export default function DragAndDropZone({ children, customOverlay, accepts, onValidate }: DropOverlayProps) {
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        isAccepted: false,
        rect: null,
        cursorPos: null,
        hoveredElement: null,
    });

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

    // Centralized acceptance check
    const checkAcceptance = (event: React.DragEvent<HTMLElement>) => {
        if (onValidate) return onValidate(event);
        if (accepts && event.dataTransfer) {
            // Checks if any of the accepted types are included in the dragged item's types
            return accepts.some(type => event.dataTransfer.types.includes(type));
        }
        return true; // Default to true if no validation rules are provided
    };

    const handleDrop = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const isAccepted = checkAcceptance(event);

        dragCounter.current = 0;
        setDragState(prev => ({
            ...prev,
            isDragging: false,
            cursorPos: null,
            hoveredElement: null,
        }));

        if (isAccepted) {
            console.log("Dropped and Accepted!");
            if (children.props.onDrop) children.props.onDrop(event);
        } else {
            console.log("Drop Rejected!");
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
        event.stopPropagation();
        
        const isAccepted = checkAcceptance(event);

        if (isAccepted) {
            event.preventDefault(); // Calling preventDefault() is required to natively ALLOW a drop
            if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
        } else {
            if (event.dataTransfer) event.dataTransfer.dropEffect = "none";
        }

        // Update cursor position and hovered element in real-time
        setDragState(prev => ({
            ...prev,
            isAccepted,
            cursorPos: { x: event.clientX, y: event.clientY },
            hoveredElement: event.target as HTMLElement,
        }));

        if (children.props.onDragOver) children.props.onDragOver(event);
    };

    const handleDragEnter = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        dragCounter.current += 1;

        if (dragCounter.current === 1) {
            const isAccepted = checkAcceptance(event);
            let targetRect = null;
            
            if (localRef.current) {
                targetRect = localRef.current.getBoundingClientRect();
            }

            setDragState(prev => ({
                ...prev,
                isDragging: true,
                isAccepted,
                rect: targetRect,
            }));
        }

        if (children.props.onDragEnter) children.props.onDragEnter(event);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        dragCounter.current -= 1;

        if (dragCounter.current === 0) {
            setDragState(prev => ({
                ...prev,
                isDragging: false,
                cursorPos: null,
                hoveredElement: null,
            }));
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

            {/* Render Custom Overlay if provided, otherwise fallback to Default Overlay */}
            {customOverlay ? customOverlay(dragState) : (
                dragState.isDragging && dragState.rect && (
                    <Box
                        sx={{
                            position: "fixed",
                            top: dragState.rect.top,
                            left: dragState.rect.left,
                            width: dragState.rect.width,
                            height: dragState.rect.height,
                            backgroundColor: dragState.isAccepted ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 0, 0, 0.1)",
                            pointerEvents: "none",
                            zIndex: 9999,
                            border: "2px dashed",
                            borderColor: dragState.isAccepted ? "primary.main" : "error.main",
                            borderRadius: 1,
                        }}
                    />
                )
            )}
        </Fragment>
    );
}