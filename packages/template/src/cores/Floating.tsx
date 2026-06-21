import { styled } from "@mui/material";
import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const Container = styled(motion.div)({
    position: "fixed",
    zIndex: 1000,
    // Add a max-height and overflow-y just in case the content itself is taller than the screen
    maxHeight: "90vh",
    overflow: "hidden"
});

interface FloatingProps {
    children?: React.ReactNode;
    open?: boolean;
    onClose?: () => void;
    anchor?: HTMLElement | RefObject<HTMLElement | null> | null;
    anchorOrigin?: {
        vertical: "top" | "center" | "bottom";
        horizontal: "left" | "center" | "right";
    };
    transformOrigin?: {
        vertical: "top" | "center" | "bottom";
        horizontal: "left" | "center" | "right";
    };
    // New prop to set a safe distance from the edge of the screen
    viewportMargin?: number;
}

const defaultOrigin = { vertical: "bottom", horizontal: "left" } as const;
const defaultTransform = { vertical: "top", horizontal: "left" } as const;

export default function Floating({
    children,
    anchor,
    open,
    onClose,
    anchorOrigin = defaultOrigin,
    transformOrigin = defaultTransform,
    viewportMargin = 12 // Default 12px safe zone from screen edges
}: FloatingProps) {
    const floatRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, ready: false });

    const getAnchorElement = () => {
        if (!anchor) return null;
        return "current" in anchor ? anchor.current : anchor;
    };

    useLayoutEffect(() => {
        if (!open) {
            setPosition(prev => ({ ...prev, ready: false }));
            return;
        }

        const updatePosition = () => {
            const anchorEl = getAnchorElement();
            const floatEl = floatRef.current;

            if (!anchorEl || !floatEl) return;

            // Anchor is safe to measure with getBoundingClientRect
            const anchorRect = anchorEl.getBoundingClientRect();

            // Use offsetWidth/Height to ignore Framer Motion's scale and y transforms!
            const floatRect = {
                width: floatEl.offsetWidth,
                height: floatEl.offsetHeight
            };

            let top = anchorRect.top;
            let left = anchorRect.left;

            // 1. Calculate Base Position
            if (anchorOrigin.vertical === "center") top += anchorRect.height / 2;
            else if (anchorOrigin.vertical === "bottom") top += anchorRect.height;

            if (anchorOrigin.horizontal === "center") left += anchorRect.width / 2;
            else if (anchorOrigin.horizontal === "right") left += anchorRect.width;

            // 2. Adjust Offsets
            if (transformOrigin.vertical === "center") top -= floatRect.height / 2;
            else if (transformOrigin.vertical === "bottom") top -= floatRect.height;

            if (transformOrigin.horizontal === "center") left -= floatRect.width / 2;
            else if (transformOrigin.horizontal === "right") left -= floatRect.width;

            // 3. Collision Detection (Viewport Clamping)
            const maxLeft = window.innerWidth - floatRect.width - viewportMargin;
            if (left > maxLeft) left = maxLeft;
            if (left < viewportMargin) left = viewportMargin;

            const maxTop = window.innerHeight - floatRect.height - viewportMargin;
            if (top > maxTop) {
                const spaceAboveAnchor = anchorRect.top - viewportMargin;
                if (anchorOrigin.vertical === "bottom" && spaceAboveAnchor > floatRect.height) {
                    top = anchorRect.top - floatRect.height;
                } else {
                    top = maxTop;
                }
            }
            if (top < viewportMargin) top = viewportMargin;

            setPosition({ top, left, ready: true });
        };

        updatePosition();

        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);

        const resizeObserver = new ResizeObserver(updatePosition);
        const anchorEl = getAnchorElement();
        const floatEl = floatRef.current;

        if (anchorEl) resizeObserver.observe(anchorEl);
        if (floatEl) resizeObserver.observe(floatEl);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
            resizeObserver.disconnect();
        };
    }, [open, anchor, anchorOrigin, transformOrigin, viewportMargin]);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            const anchorEl = getAnchorElement();
            const floatEl = floatRef.current;
            const target = e.target as Node;

            if (
                floatEl && !floatEl.contains(target) &&
                anchorEl && !anchorEl.contains(target)
            ) {
                onClose?.();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, anchor, onClose]);

    const cssTransformOrigin = `${transformOrigin.vertical} ${transformOrigin.horizontal}`;

    return (
        <AnimatePresence>
            {open && (
                <Container
                    ref={floatRef}
                    style={{
                        top: position.top,
                        left: position.left,
                        transformOrigin: cssTransformOrigin,
                        visibility: position.ready ? "visible" : "hidden",
                    }}
                    initial={{ opacity: 0, scale: 0.95, y: transformOrigin.vertical === 'bottom' ? 10 : -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: transformOrigin.vertical === 'bottom' ? 5 : -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    {children}
                </Container>
            )}
        </AnimatePresence>
    );
}