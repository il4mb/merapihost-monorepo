"use client";
import { Box } from "@mui/material";
import { useStudio } from "@/contexts/StudioProvider";
import { useEffect, useMemo, useRef } from "react";
import type { NodeObject } from "@/types";
import { debounce } from "lodash";

type CanvasGestureProps = {
    iframe: HTMLIFrameElement;
};

export default function CanvasGesture({ iframe }: CanvasGestureProps) {

    const { state, dispatch } = useStudio();
    const { scale = 1 } = state.viewport || {};

    const domsRef = useRef<Map<string, HTMLElement>>(new Map()); // Store DOM elements for each node
    const arrayNodeRef = useRef<NodeObject[]>([]); // Store the array of nodes for comparison

    const targetScroll = useRef({ x: 0, y: 0 });
    const animFrameId = useRef<number | null>(null);
    const currentScrollTarget = useRef<HTMLElement | Window | null>(null);

    // Keep domsRef synced for event listeners
    useEffect(() => {
        domsRef.current = state.doms;
    }, [state.doms]);

    // Keep a ref to the latest nodes array for event handlers to access
    useEffect(() => {
        arrayNodeRef.current = Array.from(state.nodes.values());
    }, [state.nodes]);

    useEffect(() => {
        return () => {
            if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        };
    }, []);

    const handleClickNode = useMemo(() => (e: React.MouseEvent, dom: HTMLElement) => {
        const iframeDocument = iframe?.contentDocument;
        const domEntries = Array.from(domsRef.current.entries());
        let targetId = domEntries.find(([id, d]) => d === dom)?.[0] || null;

        if (!targetId) {
            let current = dom;
            if (current === iframeDocument?.body) {
                targetId = "root";
            } else {
                while (current && current !== iframeDocument?.body) {
                    targetId = domEntries.find(([id, d]) => d === current)?.[0] || null;
                    if (targetId) break;
                    current = current.parentElement as HTMLElement;
                }
            }
        }

        if (targetId) {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                dispatch({ type: "ADD_SELECTED", payload: targetId });
            } else {
                dispatch({ type: "SET_SELECTED", payload: targetId });
            }
        } else {
            dispatch({ type: "CLEAR_SELECTED" });
        }
    }, [dispatch]);

    const handleHoverNode = useMemo(() => (e: React.MouseEvent, dom: HTMLElement) => {
        const domEntries = Array.from(domsRef.current.entries());
        const iframeDocument = iframe?.contentDocument;
        let [targetId] = domEntries.find(([id, d]) => d === dom) || [null, null];
        if (!targetId) {
            let current = dom;
            if (current === iframeDocument?.body) {
                targetId = "root";
            } else {
                while (current && current !== iframeDocument?.body) {
                    targetId = domEntries.find(([id, dom]) => dom === current)?.[0] || null;
                    if (targetId) break;
                    current = current.parentElement as HTMLElement;
                }
            }

        }
        if (targetId) {
            dispatch({ type: "SET_HOVERED", payload: targetId });
        } else {
            dispatch({ type: "CLEAR_HOVERED" });
        }
    }, [dispatch]);

    const onMouseEnter = useMemo(() => debounce((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const iframeDoc = iframe?.contentDocument;
        const iframeWin = iframe?.contentWindow;

        if (!iframeDoc || !iframeWin) return;

        const rect = iframe.getBoundingClientRect();
        const iframeClientX = (event.clientX - rect.left) / scale;
        const iframeClientY = (event.clientY - rect.top) / scale;

        const target = iframeDoc.elementFromPoint(iframeClientX, iframeClientY) as HTMLElement | null;
        if (!target) return;

        handleHoverNode(event, target);
    }, 50), [iframe, scale, handleHoverNode]);

    const onMouseLeave = useMemo(() => debounce((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        dispatch({ type: "CLEAR_HOVERED" });
    }, 50), [dispatch]);

    const onMouseDown = useMemo(() => debounce((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const iframeDoc = iframe?.contentDocument;
        const iframeWin = iframe?.contentWindow;

        if (!iframeDoc || !iframeWin) return;

        const rect = iframe.getBoundingClientRect();
        const iframeClientX = (event.clientX - rect.left) / scale;
        const iframeClientY = (event.clientY - rect.top) / scale;

        const target = iframeDoc.elementFromPoint(iframeClientX, iframeClientY) as HTMLElement | null;
        if (!target) return;
        handleClickNode(event, target);
    }, 50), [iframe, scale, handleClickNode]);

    const onWheel = useMemo(() => (event: React.WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const iframeDoc = iframe?.contentDocument;
        const iframeWin = iframe?.contentWindow;

        if (!iframeDoc || !iframeWin) return;

        // 1. Normalize deltaMode (Pixels vs Lines vs Pages)
        let deltaX = event.deltaX;
        let deltaY = event.deltaY;

        if (event.deltaMode === 1) { // DOM_DELTA_LINE
            deltaX *= 16;
            deltaY *= 16;
        } else if (event.deltaMode === 2) { // DOM_DELTA_PAGE
            deltaX *= 100;
            deltaY *= 100;
        }

        // 2. Scale the scroll deltas
        const scaledDeltaX = deltaX * scale;
        const scaledDeltaY = deltaY * scale;

        // 3. Find target element under cursor
        const rect = iframe.getBoundingClientRect();
        const iframeClientX = (event.clientX - rect.left) / scale;
        const iframeClientY = (event.clientY - rect.top) / scale;

        const target = iframeDoc.elementFromPoint(iframeClientX, iframeClientY) as HTMLElement | null;
        const iframeWindow = iframeWin as Window & typeof globalThis;

        if (target && iframeWindow.WheelEvent) {
            const syntheticWheel = new iframeWindow.WheelEvent("wheel", {
                deltaX: scaledDeltaX,
                deltaY: scaledDeltaY,
                deltaZ: event.deltaZ,
                deltaMode: 0,
                clientX: iframeClientX,
                clientY: iframeClientY,
                screenX: event.screenX,
                screenY: event.screenY,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey,
                metaKey: event.metaKey,
                bubbles: true,
                cancelable: true,
            });

            const isCanceled = !target.dispatchEvent(syntheticWheel);
            if (isCanceled) return;
        }

        // 4. Find nearest scrollable container
        let scrollTarget: HTMLElement | Window = iframeWin;
        let current = target;

        while (current && current !== iframeDoc.body && current !== iframeDoc.documentElement) {
            const style = iframeWin.getComputedStyle(current);
            const canScrollY = (style.overflowY === "auto" || style.overflowY === "scroll") && current.scrollHeight > current.clientHeight;
            const canScrollX = (style.overflowX === "auto" || style.overflowX === "scroll") && current.scrollWidth > current.clientWidth;

            if (canScrollY || canScrollX) {
                scrollTarget = current;
                break;
            }
            current = current.parentElement;
        }

        // 5. Accumulate deltas into kinetic buffer
        targetScroll.current.x += scaledDeltaX;
        targetScroll.current.y += scaledDeltaY;
        currentScrollTarget.current = scrollTarget;

        // 6. Smooth Damping Render Loop (requestAnimationFrame)
        if (!animFrameId.current) {
            const step = () => {
                const activeTarget = currentScrollTarget.current;
                if (!activeTarget) return;

                // Ease factor: 0.15 = buttery/smooth, 0.3 = crisp/fast
                const dampingFactor = 0.2;
                const dx = targetScroll.current.x * dampingFactor;
                const dy = targetScroll.current.y * dampingFactor;

                if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                    activeTarget.scrollBy(dx, dy);
                    targetScroll.current.x -= dx;
                    targetScroll.current.y -= dy;
                    animFrameId.current = requestAnimationFrame(step);
                } else {
                    // Drain remaining fraction and stop loop
                    activeTarget.scrollBy(targetScroll.current.x, targetScroll.current.y);
                    targetScroll.current = { x: 0, y: 0 };
                    animFrameId.current = null;
                }
            };

            animFrameId.current = requestAnimationFrame(step);
        }
    }, [iframe, scale]);

    return (
        <Box
            onMouseEnter={onMouseEnter}
            onMouseMove={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown}
            onWheel={onWheel}
            sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 1000,
                backgroundColor: "#ff00"
            }}
        />
    );
}