import { styled } from "@mui/material";
import { useEditor } from "./EditorProvider";
import { useEffect, useState, useCallback } from "react";

const Container = styled("div")({
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    margin: "10px",
    overflow: "visible"
});

export type RelativeRect = {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
};

interface SlotsManagerProps {}

export default function SlotsManager({}: SlotsManagerProps) {
    const { state } = useEditor();

    const [hoveredRelativeRects, setHoveredRelativeRects] = useState<RelativeRect[][]>([]);
    const [selectedRelativeRects, setSelectedRelativeRects] = useState<RelativeRect[][]>([]);

    // Helper function to recalculate rects
    const recalculateRects = useCallback(() => {
        if (!state.viewport?.rect || state.viewport.width === 0 || state.viewport.height === 0) {
            setHoveredRelativeRects([]);
            setSelectedRelativeRects([]);
            return;
        }

        const scale = state.viewport.scale || 1;
        const vRect = state.viewport.rect;

        // Reusable calculator for Sets of IDs
        const calculateRectsForSet = (ids: Set<string>) => {
            const newRects: RelativeRect[][] = [];
            ids.forEach(id => {
                const dom = state.doms.get(id); // O(1) direct lookup
                if (dom) {
                    const rectList = dom.getClientRects();
                    const relativeRects: RelativeRect[] = [];
                    for (let i = 0; i < rectList.length; i++) {
                        const rect = rectList[i];
                        relativeRects.push({
                            top: vRect.top + rect.top * scale,
                            left: vRect.left + rect.left * scale,
                            bottom: vRect.top + rect.bottom * scale,
                            right: vRect.left + rect.right * scale,
                            width: rect.width * scale,
                            height: rect.height * scale
                        });
                    }
                    newRects.push(relativeRects);
                }
            });
            return newRects;
        };

        setHoveredRelativeRects(calculateRectsForSet(state.hovered));
        setSelectedRelativeRects(calculateRectsForSet(state.selected));
    }, [
        state.viewport?.rect, 
        state.viewport?.scale, 
        state.viewport?.width, 
        state.viewport?.height, 
        state.hovered, 
        state.selected, 
        state.doms
    ]);

    // Update rects when state changes
    useEffect(() => {
        recalculateRects();
    }, [recalculateRects]);

    // Listen to DOM changes via ResizeObserver
    useEffect(() => {
        if (!state.viewport?.rect) return;

        // Create a single observer for all nodes
        const observer = new ResizeObserver(() => {
            recalculateRects();
        });

        const allNodeIds = new Set([...state.hovered, ...state.selected]);

        allNodeIds.forEach(id => {
            const dom = state.doms.get(id);
            if (dom) {
                observer.observe(dom);
            }
        });
        observer.observe(document.body); // Observe body for any layout changes
        observer.observe(document.documentElement); // Observe html for any layout changes

        // Cleanup observers on unmount or dependency change
        return () => {
            observer.disconnect();
        };
    }, [state.hovered, state.selected, state.doms, state.viewport?.rect, recalculateRects]);

    return (
        <Container>
            {selectedRelativeRects.map((rects, index) => (
                <SelectedSlot key={`selected-${index}`} rects={rects} />
            ))}
            {hoveredRelativeRects.map((rects, index) => (
                <HoveredSlot key={`hover-${index}`} rects={rects} />
            ))}
        </Container>
    );
}

// ----------------------------------------------------------------------
// SVG Overlays
// ----------------------------------------------------------------------

const HoveredSlot = ({ rects }: { rects: RelativeRect[] }) => {
    const path = generateSvgPath(rects);

    return (
        <svg style={svgStyles}>
            <path
                d={path}
                fill="rgba(60, 0, 255, 0)"
                stroke="#3488ff"
                strokeWidth={1}
                strokeDasharray="4 2"
            />
        </svg>
    );
};

const SelectedSlot = ({ rects }: { rects: RelativeRect[] }) => {
    const path = generateSvgPath(rects);

    return (
        <svg style={svgStyles}>
            <path
                d={path}
                fill="rgba(60, 0, 255, 0.05)"
                stroke="#3488ff"
                strokeWidth={2}
            />
        </svg>
    );
};

// --- Helpers ---

const svgStyles: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    overflow: "visible"
};

const generateSvgPath = (rects: RelativeRect[]) => {
    const d = [];
    for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        d.push(`M${rect.left},${rect.top} L${rect.right},${rect.top} L${rect.right},${rect.bottom} L${rect.left},${rect.bottom} Z`);
    }
    return d.join(" ");
};