import Box from "@mui/material/Box";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useStudio } from "@/contexts/StudioProvider";

type Props = {
    target: HTMLElement;
    position: "before" | "after" | "inside";
    direction: "horizontal" | "vertical";
};

const LINE_THICKNESS = 4;
const HALF_THICKNESS = LINE_THICKNESS / 2;

// Minimum fraction of overlap (relative to the smaller element's cross-axis size)
// required to consider two rects "aligned" on the same row/column.
const ALIGNMENT_OVERLAP_RATIO = 0.3;

type Rect = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};

export default function DropIndicator({ target, position, direction }: Props) {
    const { state } = useStudio();

    const scrollX = state.viewport?.scroll?.x ?? 0;
    const scrollY = state.viewport?.scroll?.y ?? 0;

    const toRect = (el: Element): Rect => {
        const r = el.getBoundingClientRect();
        return {
            left: r.left + scrollX,
            top: r.top + scrollY,
            right: r.right + scrollX,
            bottom: r.bottom + scrollY,
            width: r.width,
            height: r.height,
        };
    };

    // 1. Get target element bounding rect in viewport + scroll space
    const rect = useMemo(() => {
        if (!target) return null;
        return toRect(target);
    }, [target, scrollX, scrollY]);

    const isCrossAxisAligned = (a: Rect, b: Rect, isHorizontal: boolean): boolean => {
        if (isHorizontal) {
            const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            const minHeight = Math.min(a.height, b.height, 1);
            return overlap / minHeight >= ALIGNMENT_OVERLAP_RATIO;
        } else {
            const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const minWidth = Math.min(a.width, b.width, 1);
            return overlap / minWidth >= ALIGNMENT_OVERLAP_RATIO;
        }
    };

    // 2. Get adjacent sibling bounding rect for "before" / "after" positioning
    const nextRect = useMemo(() => {
        if (!target || !rect || position === "inside") return null;

        const isHorizontal = direction === "horizontal";
        const nextElement = position === "before" ? target.previousElementSibling : target.nextElementSibling;
        if (!nextElement) return null;

        const elRect = toRect(nextElement);

        if (!isCrossAxisAligned(rect, elRect, isHorizontal)) {
            return null;
        }

        return elRect;
    }, [target, rect, position, direction, scrollX, scrollY]);

    // 3. Calculate indicator coordinates (line for before/after, container frame for inside)
    const indicatorCoords = useMemo(() => {
        if (!rect) return null;

        if (position === "inside") {
            const MIN_SIZE = 24;
            const width = Math.max(rect.width, MIN_SIZE);
            const height = Math.max(rect.height, MIN_SIZE);
            const left = rect.width < MIN_SIZE ? rect.left - (MIN_SIZE - rect.width) / 2 : rect.left;
            const top = rect.height < MIN_SIZE ? rect.top - (MIN_SIZE - rect.height) / 2 : rect.top;

            return { left, top, width, height };
        }

        const isHorizontal = direction === "horizontal";

        if (isHorizontal) {
            let x: number;

            if (position === "before") {
                x = nextRect ? (nextRect.right + rect.left) / 2 : rect.left;
            } else {
                x = nextRect ? (rect.right + nextRect.left) / 2 : rect.right;
            }

            const top = nextRect ? Math.min(rect.top, nextRect.top) : rect.top;
            const bottom = nextRect ? Math.max(rect.bottom, nextRect.bottom) : rect.bottom;

            return {
                left: x - HALF_THICKNESS,
                top,
                width: LINE_THICKNESS,
                height: bottom - top,
            };
        } else {
            let y: number;

            if (position === "before") {
                y = nextRect ? (nextRect.bottom + rect.top) / 2 : rect.top;
            } else {
                y = nextRect ? (rect.bottom + nextRect.top) / 2 : rect.bottom;
            }

            const left = nextRect ? Math.min(rect.left, nextRect.left) : rect.left;
            const right = nextRect ? Math.max(rect.right, nextRect.right) : rect.right;

            return {
                left,
                top: y - HALF_THICKNESS,
                width: right - left,
                height: LINE_THICKNESS,
            };
        }
    }, [rect, nextRect, position, direction]);

    if (!indicatorCoords) return null;

    const isInside = position === "inside";

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{
                opacity: 1,
                left: indicatorCoords.left,
                top: indicatorCoords.top,
                width: indicatorCoords.width,
                height: indicatorCoords.height,
            }}
            exit={{ opacity: 0 }}
            transition={{
                duration: 0.08,
                ease: "easeOut",
            }}
            sx={{
                position: "absolute",
                pointerEvents: "none",
                zIndex: 9999,
                backgroundColor: isInside ? "rgba(204, 25, 210, 0.12)" : "#cc19d2",
                border: isInside ? "2px dashed #cc19d2" : "none",
                boxShadow: isInside
                    ? "inset 0 0 8px rgba(204, 25, 210, 0.25)"
                    : "0 0 4px rgba(25, 118, 210, 0.26)",
                borderRadius: "5px",
                boxSizing: "border-box",
            }}
        />
    );
}