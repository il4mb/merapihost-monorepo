import { useCallback, useEffect, useState, useMemo, memo, Fragment } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { getLayoutBoxes } from "@/libs/tools/layout";
import type { Edge, LayoutBoxes } from "@/types";
import { NodeModel } from "@/libs/node/NodeModel";
import NodeActions from "@/libs/node/NodeActions";
import { useNodes, useStudio } from "@/contexts";

const COLORS = {
    margin: "rgba(243, 202, 18, 0.35)", // Orange
    border: "rgba(255, 204, 0, 0.4)", // Yellow
    padding: "rgba(11, 243, 50, .35)", // Green
    content: "rgba(52, 136, 255, 1)", // Blue
}


type IndicatorActionProps = {
    node: NodeModel;
    element: HTMLElement;
    layout: LayoutBoxes;
};

const IndicatorAction = memo(({ node, layout }: IndicatorActionProps) => {

    const posX = layout.border.left;
    const posY = layout.border.top;

    return (
        <Box
            sx={{
                position: "absolute",
                top: posY,
                left: posX,
                transform: "translateY(-100%) translateY(-4px)",
                minWidth: 50,
                minHeight: 30,
                padding: "0px 3px 0px 4px",
                fontSize: 12,
                color: "#fff",
                zIndex: 9999,
                backgroundColor: "rgb(1, 111, 255)",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                borderRadius: .3,
                overflow: "hidden",
                pointerEvents: "auto",
                whiteSpace: "nowrap",
            }}>
            <Stack direction={"row"} sx={{ alignItems: "center", gap: .75 }}>
                {node.type?.icon && (
                    <Box component={node.type.icon} size={14} />
                )}
                <Typography variant="caption" sx={{ fontSize: 14, color: "#fff", lineHeight: 1 }}>
                    {node.type?.model.name || node.name || "Unknown Type"}
                </Typography>
            </Stack>
            <NodeActions node={node} />
        </Box>
    );
});

type IndicatorProps = {
    node: NodeModel;
}
const Indicator = memo(({ node }: IndicatorProps) => {
    const { state: { viewport } } = useStudio();
    const [layout, setLayout] = useState<LayoutBoxes | null>(null);

    const updateLayout = useCallback(() => {
        const layoutBoxes = getLayoutBoxes(node.dom!, viewport);
        if (!layoutBoxes) return;
        setLayout(layoutBoxes);
    }, [node.dom!, viewport]);

    useEffect(() => {
        // Target document and window (handles both iframe and root document contexts)
        const doc = node.dom?.ownerDocument;
        const win = doc?.defaultView;

        let rafId: number | null = null;

        // Schedule layout recalculation after browser reflow completes
        const scheduleUpdate = () => {
            if (rafId) win?.cancelAnimationFrame(rafId);
            rafId = win?.requestAnimationFrame(updateLayout) ?? null;
        };

        // Initial update
        scheduleUpdate();

        // 1. ResizeObserver: Watch element AND document body for global layout shifts
        const resizeObserver = new ResizeObserver(scheduleUpdate);
        resizeObserver.observe(node.dom!);
        if (doc?.body) {
            resizeObserver.observe(doc.body);
        }

        // 2. MutationObserver: Watch full subtree mutations (DOM additions, removals, style/class shifts)
        const mutationObserver = new MutationObserver(scheduleUpdate);
        if (doc?.body) {
            mutationObserver.observe(doc.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
                attributeFilter: ["style", "class", "hidden"],
            });
        }

        // 3. Scroll & Window Resize Listeners
        const iframeWin = viewport.iframe?.contentWindow || win;
        iframeWin?.addEventListener("scroll", scheduleUpdate, true);
        iframeWin?.addEventListener("resize", scheduleUpdate);

        return () => {
            if (rafId) win?.cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            iframeWin?.removeEventListener("scroll", scheduleUpdate, true);
            iframeWin?.removeEventListener("resize", scheduleUpdate);
        };
    }, [updateLayout, node.dom!, viewport.iframe]);

    const createRectPath = (edge: Edge) => {
        return `M${edge.left},${edge.top} L${edge.right},${edge.top} L${edge.right},${edge.bottom} L${edge.left},${edge.bottom} Z`;
    };

    if (!layout) return null;

    return (
        <Fragment>
            <IndicatorAction
                layout={layout}
                node={node}
                element={node.dom!}
            />
            <Box
                component="svg"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    width: "100%",
                    height: "100%",
                }}>
                {/* --- PATTERN DEFINITIONS --- */}
                <defs>
                    <pattern
                        id="stripes-margin"
                        patternUnits="userSpaceOnUse"
                        width="8"
                        height="8"
                        patternTransform="rotate(-45)">
                        <rect width="4" height="8" fill={COLORS.margin} />
                    </pattern>
                    <pattern
                        id="stripes-padding"
                        patternUnits="userSpaceOnUse"
                        width="8"
                        height="8"
                        patternTransform="rotate(45)">
                        <rect width="4" height="8" fill={COLORS.padding} />
                    </pattern>
                </defs>

                {/* 1. Margin Area */}
                <path
                    d={`${createRectPath(layout.margin)} ${createRectPath(layout.border)}`}
                    fillRule="evenodd"
                    fill="url(#stripes-margin)"
                />

                {/* 2. Border Area */}
                <path
                    d={`${createRectPath(layout.border)} ${createRectPath(layout.padding)}`}
                    fillRule="evenodd"
                    fill={COLORS.border}
                />

                {/* 3. Padding Area */}
                <path
                    d={`${createRectPath(layout.padding)} ${createRectPath(layout.content)}`}
                    fillRule="evenodd"
                    fill="url(#stripes-padding)"
                />

                {/* 4. Content Area */}
                <path
                    d={createRectPath(layout.padding)}
                    fill="transparent"
                    stroke={COLORS.content}
                    strokeDasharray="5,2"
                    strokeWidth={1.5}
                />
            </Box>
        </Fragment>
    );
});

export default function SelectedIndicators() {
    const { state: { selected, collection } } = useNodes();;
    const selectedNodes = useMemo(() => {
        return Array.from(selected).map((id) =>
            collection.get(id)
        ).filter((node): node is NodeModel => Boolean(node && node.dom));
    }, [selected, collection]);

    return (
        <Fragment>
            {selectedNodes.map((node) => (
                <Indicator key={node.id} node={node} />
            ))}
        </Fragment>
    );
}