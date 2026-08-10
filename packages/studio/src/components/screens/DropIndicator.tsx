import Box from "@mui/material/Box";
import { motion } from "motion/react";
import { useMemo } from "react";
import { useStudio } from "@/contexts/StudioProvider";

type Props = {
    target: HTMLElement;
    position: "before" | "after";
    direction: "horizontal" | "vertical";
};

const LINE_THICKNESS = 4;
const HALF_THICKNESS = LINE_THICKNESS / 2;

// Minimum fraction of overlap (relative to the smaller element's cross-axis size)
// required to consider two rects "aligned" on the same row/column. Guards against
// treating a wrapped grid item (next row/column) as an in-row/column neighbor.
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

    const scrollX = state.viewport?.scroll?.left ?? 0;
    const scrollY = state.viewport?.scroll?.top ?? 0;

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

    // Checks whether `candidate` sits on the same row (for horizontal flow) or
    // same column (for vertical flow) as `rect` — i.e. shares meaningful
    // cross-axis overlap. Prevents grabbing a sibling from a different
    // wrapped row/column just because it's adjacent in DOM order.
    const isCrossAxisAligned = (a: Rect, b: Rect, isHorizontal: boolean): boolean => {
        if (isHorizontal) {
            // cross axis = vertical (top/bottom)
            const overlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            const minHeight = Math.min(a.height, b.height, 1);
            return overlap / minHeight >= ALIGNMENT_OVERLAP_RATIO;
        } else {
            // cross axis = horizontal (left/right)
            const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const minWidth = Math.min(a.width, b.width, 1);
            return overlap / minWidth >= ALIGNMENT_OVERLAP_RATIO;
        }
    };

    // 2. Get adjacent sibling bounding rect (if available AND actually aligned
    //    on the cross axis — otherwise it's a different row/column in a wrap
    //    layout and shouldn't be used to size the indicator).
    const nextRect = useMemo(() => {
        if (!target || !rect) return null;

        const isHorizontal = direction === "horizontal";
        const nextElement = position === "before" ? target.previousElementSibling : target.nextElementSibling;
        if (!nextElement) return null;

        const elRect = toRect(nextElement);

        if (!isCrossAxisAligned(rect, elRect, isHorizontal)) {
            return null;
        }

        return elRect;
    }, [target, rect, position, direction, scrollX, scrollY]);

    // 3. Calculate indicator line coordinates centered in the gap
    const indicatorCoords = useMemo(() => {
        if (!rect) return null;

        const isHorizontal = direction === "horizontal";

        if (isHorizontal) {
            // Horizontal flow -> vertical indicator line
            let x: number;

            if (position === "before") {
                x = nextRect ? (nextRect.right + rect.left) / 2 : rect.left;
            } else {
                x = nextRect ? (rect.right + nextRect.left) / 2 : rect.right;
            }

            // Only span across both elements when they're actually aligned
            // (nextRect is null otherwise) — so this never bridges rows.
            const top = nextRect ? Math.min(rect.top, nextRect.top) : rect.top;
            const bottom = nextRect ? Math.max(rect.bottom, nextRect.bottom) : rect.bottom;

            return {
                left: x - HALF_THICKNESS,
                top,
                width: LINE_THICKNESS,
                height: bottom - top,
            };
        } else {
            // Vertical flow -> horizontal indicator line
            let y: number;

            if (position === "before") {
                y = nextRect ? (nextRect.bottom + rect.top) / 2 : rect.top;
            } else {
                y = nextRect ? (rect.bottom + nextRect.top) / 2 : rect.bottom;
            }

            // Only span across both elements when they're actually aligned
            // (nextRect is null otherwise) — so this never bridges columns.
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
                backgroundColor: "#cc19d2",
                boxShadow: "0 0 4px rgba(25, 118, 210, 0.26)",
                borderRadius: '5px',
            }}
        />
    );
}