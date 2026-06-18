import { NodeObject } from "../../type";
import { useCallback, useEffect, useState } from "react";
import { useViewport } from "../../cores/EditorProvider";
import { Box, useColorScheme, useTheme } from "@mui/material";

interface SelectedProps {
    element: HTMLElement;
    node: NodeObject;
}

interface BoxDimensions {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface LayoutState {
    marginBox: BoxDimensions;
    borderBox: BoxDimensions;
    paddingBox: BoxDimensions;
    contentBox: BoxDimensions;
}

export default function Selected({ element, node }: SelectedProps) {

    const { mode } = useColorScheme();
    const viewport = useViewport();
    const [layout, setLayout] = useState<LayoutState | null>(null);

    const isDark = mode === "dark";

    const updateLayout = useCallback(() => {
        const scale = viewport.scale;
        const rectList = Array.from(element.getClientRects());
        if (rectList.length === 0) return;

        const style = window.getComputedStyle(element);

        // 1. Calculate overall Border Box from client rects
        const bTop = Math.min(...rectList.map(r => r.top));
        const bLeft = Math.min(...rectList.map(r => r.left));
        const bBottom = Math.max(...rectList.map(r => r.bottom));
        const bRight = Math.max(...rectList.map(r => r.right));

        // Apply viewport offset and scale (fixed double addition bug)
        const borderBox = {
            top: viewport.rect.top + bTop * scale,
            left: viewport.rect.left + bLeft * scale,
            bottom: viewport.rect.top + bBottom * scale,
            right: viewport.rect.left + bRight * scale,
        };

        // 2. Parse CSS values
        const parseVal = (val: string) => (parseFloat(val) || 0) * scale;

        const pt = parseVal(style.paddingTop);
        const pr = parseVal(style.paddingRight);
        const pb = parseVal(style.paddingBottom);
        const pl = parseVal(style.paddingLeft);

        const mt = parseVal(style.marginTop);
        const mr = parseVal(style.marginRight);
        const mb = parseVal(style.marginBottom);
        const ml = parseVal(style.marginLeft);

        const bt = parseVal(style.borderTopWidth);
        const br = parseVal(style.borderRightWidth);
        const bb = parseVal(style.borderBottomWidth);
        const bl = parseVal(style.borderLeftWidth);

        // 3. Calculate Margin Box (extends OUTWARD from border box)
        const marginBox = {
            top: borderBox.top - mt,
            left: borderBox.left - ml,
            bottom: borderBox.bottom + mb,
            right: borderBox.right + mr,
        };

        // 4. Calculate Padding Box (shrinks INWARD from border box)
        const paddingBox = {
            top: borderBox.top + bt,
            left: borderBox.left + bl,
            bottom: borderBox.bottom - bb,
            right: borderBox.right - br,
        };

        // 5. Calculate Content Box (shrinks INWARD from padding box)
        const contentBox = {
            top: paddingBox.top + pt,
            left: paddingBox.left + pl,
            bottom: paddingBox.bottom - pb,
            right: paddingBox.right - pr,
        };

        setLayout({ marginBox, borderBox, paddingBox, contentBox });
    }, [element, viewport]);

    useEffect(() => {
        // Initial calculation
        updateLayout();

        // 1. Catch actual size changes (Layout shifts, content growth)
        const resizeObserver = new ResizeObserver(updateLayout);
        resizeObserver.observe(element);

        // 2. Catch direct CSS manipulation (Margin, Padding, Borders)
        const mutationObserver = new MutationObserver(() => {
            updateLayout();
        });

        // Observe changes to 'style' or 'class' attributes on the target element
        mutationObserver.observe(element, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });

        // 3. Catch scrolling (Optional but highly recommended for DevTools)
        // 'true' uses capture phase to catch scrolls on any parent container
        window.addEventListener('scroll', updateLayout, true);
        window.addEventListener('resize', updateLayout);

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            window.removeEventListener('scroll', updateLayout, true);
            window.removeEventListener('resize', updateLayout);
        };
    }, [updateLayout, element]);

    const createRectPath = (rect: BoxDimensions) => {
        return `M${rect.left},${rect.top} L${rect.right},${rect.top} L${rect.right},${rect.bottom} L${rect.left},${rect.bottom} Z`;
    };

    if (!layout) return null;

    return (
        <Box component="svg" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", width: "100%", height: "100%" }}>

            {/* --- PATTERN DEFINITIONS --- */}
            <defs>
                <pattern id="stripes-margin" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(-45)">
                    <rect width="4" height="8" fill={"rgba(243, 202, 18, 0.29)"} />
                </pattern>
                <pattern id="stripes-padding" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                    <rect width="4" height="8" fill={"rgba(11, 243, 50, 0.18)"} />
                </pattern>
            </defs>

            {/* 1. Margin Area (Orange Stripes) */}
            <path
                d={`${createRectPath(layout.marginBox)} ${createRectPath(layout.borderBox)}`}
                fillRule="evenodd"
                fill="url(#stripes-margin)"
            />

            {/* 2. Border Area (Solid Yellow) */}
            <path
                d={`${createRectPath(layout.borderBox)} ${createRectPath(layout.paddingBox)}`}
                fillRule="evenodd"
                fill="rgba(255, 204, 0, 0.4)"
            />

            {/* 3. Padding Area (Green Stripes) */}
            <path
                d={`${createRectPath(layout.paddingBox)} ${createRectPath(layout.contentBox)}`}
                fillRule="evenodd"
                fill="url(#stripes-padding)"
            />

            {/* 4. Content Area (Transparent hole) */}
            <path
                d={createRectPath(layout.contentBox)}
                fill="transparent"
                stroke="#3488ff"
                strokeWidth={1.5}
            />

        </Box>
    );
}