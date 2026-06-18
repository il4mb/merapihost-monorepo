import React, { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NodeObject } from "../type";
import { createTheme, CssBaseline, ThemeProvider, styled, Box } from "@mui/material";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { createPortal } from "react-dom";
import { inputsCustomizations, dataDisplayCustomizations, feedbackCustomizations, surfacesCustomizations, colorSchemes, shadows, shape, typography, navigationCustomizations } from "@merapihost/theme";
import { useEditor } from "./EditorProvider";
import debounce from "lodash/debounce";
import { Element } from "../base/Element";
import { Root } from "../base/Root";

const Container = styled("div")({
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden"
});

const ScreenFrame = styled("div")({
    position: "absolute",
    top: "50%",
    left: "50%",
    transformOrigin: "center center",
    margin: "auto",
    border: "none",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    "&:hover": {
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
    },
    msOverflowStyle: "none", // IE and Edge
    scrollbarWidth: "none", // Firefox
    "&::-webkit-scrollbar": {
        display: "none" // Chrome, Safari, Opera
    }
});

const Iframe = styled("iframe")({
    width: "100%",
    height: "100%",
    border: "none",
    overflow: "hidden",
})

const themeOptions = {
    palette: {
        primary: { main: "#6a90f1" },
        secondary: { main: "#3bedba" },
        background: {
            default: "#fcf8fa",
            paper: "#fdfcfc"
        }
    },
    cssVariables: {
        colorSchemeSelector: "data-color-scheme",
        cssVarPrefix: "template"
    },
    spacing: 7,
    colorSchemes,
    typography,
    shadows,
    shape,
    components: {
        ...inputsCustomizations,
        ...dataDisplayCustomizations,
        ...feedbackCustomizations,
        ...navigationCustomizations,
        ...surfacesCustomizations
    }
}

interface ScreenProps {
    data?: NodeObject[]
    screenRef?: RefObject<HTMLDivElement | null>
    iframeRef?: RefObject<HTMLIFrameElement | null>
}

export default function Screen({ screenRef, iframeRef }: ScreenProps) {
    const containerRef = screenRef || useRef<HTMLDivElement>(null);
    const { state, dispatch } = useEditor();
    const rootNode = useMemo(() => state.nodes.get("root"), [state.nodes]);
    const domsRef = useRef<Map<string, HTMLElement>>(new Map());
    const arrayNodeRef = useRef<NodeObject[]>([]);


    // Viewport calculation refs to prevent stale closures in event listeners
    const scaleRef = useRef<number>(1)
    const device = useMemo(() => state.devices.find(d => d.id === state.device), [state.devices, state.device]);

    const [opacity, setOpacity] = useState(0)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const [dom, setDom] = useState<HTMLIFrameElement | null>(null)

    const bodyNode = dom?.contentDocument?.body
    const headNode = dom?.contentDocument?.head
    const isReady = !!(dom && dom.contentDocument && bodyNode && headNode)

    const { width, height, scale } = useMemo(() => {
        if (!rect) {
            return { width: "100%", height: "100%", scale: 1 }
        }

        if (!device || device.width === "100%") {
            return { width: "100%", height: "100%", scale: 1 }
        }

        const targetWidth = Number(device.width)
        const targetHeight = device.height ? Number(device.height) : rect.height

        const PADDING = 40
        const availableWidth = rect.width - PADDING
        const availableHeight = rect.height - PADDING

        const scaleX = availableWidth / targetWidth
        const scaleY = availableHeight / targetHeight

        const calculatedScale = Math.min(1, Math.min(scaleX, scaleY))

        return {
            width: targetWidth,
            height: targetHeight,
            scale: calculatedScale
        }
    }, [device, rect])

    // Keep scaleRef synced for event listeners
    useEffect(() => {
        scaleRef.current = scale
    }, [scale]);

    // Keep domsRef synced for event listeners
    useEffect(() => {
        domsRef.current = state.doms;
    }, [state.doms]);

    // Keep a ref to the latest nodes array for event handlers to access
    useEffect(() => {
        arrayNodeRef.current = Array.from(state.nodes.values());
    }, [state.nodes]);

    const theme = useMemo(() => createTheme(themeOptions), [])
    const cache = useMemo(() => {
        if (!headNode) return null
        return createCache({
            key: "editor",
            container: headNode
        })
    }, [headNode, theme])

    const clearHoveredAndSelected = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // If clicking inside the iframe area, do nothing (handled by iframe listeners)
        if (dom?.contentDocument?.body?.contains(e.target as any)) {
            return;
        };
        dispatch({ type: "CLEAR_HOVERED" });
        dispatch({ type: "CLEAR_SELECTED" });
    }, [dom, dispatch]);

    const updateViewport = useCallback(debounce(() => {
        if (!dom || !containerRef.current) return;
        dispatch({ type: "CLEAR_HOVERED" });

        const containerRect = containerRef.current!.getBoundingClientRect();
        const screenRect = dom.getBoundingClientRect();
        const scrollTop = dom.contentWindow?.scrollY || 0;
        const scrollLeft = dom.contentWindow?.scrollX || 0;

        dispatch({
            type: "UPDATE_VIEWPORT",
            payload: {
                scale: scaleRef.current,
                width: screenRect.width,
                height: screenRect.height,
                scroll: {
                    top: scrollTop,
                    left: scrollLeft
                },
                rect: {
                    top: screenRect.top - containerRect.top,
                    left: screenRect.left - containerRect.left,
                    right: screenRect.right - containerRect.left,
                    bottom: screenRect.bottom - containerRect.top
                }
            }
        });
    }, 0), [dom, dispatch]);

    // Apply listeners to the iframe's content window
    useEffect(() => {
        // Wait until both the element and its internal document are ready
        if (!dom || !dom.contentWindow || !containerRef.current) return;

        if (iframeRef) {
            iframeRef.current = dom;
        }
        const iframeWindow = dom.contentWindow;
        const iframeDocument = dom.contentDocument;
        const fadeInTimeout = setTimeout(() => {
            if (dom) setOpacity(1);
        }, 300);

        const onResize = () => updateViewport();
        const onScroll = () => updateViewport();
        const onMouseEnter = (e: MouseEvent) => {
            const domEntries = Array.from(domsRef.current.entries());
            const target = e.target as HTMLElement;
            let [targetId] = domEntries.find(([id, dom]) => dom === target) || [null, null];
            if (!targetId) {
                let current = target;
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
        }
        const onMouseLeave = () => dispatch({ type: "CLEAR_HOVERED" });
        const onMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const domEntries = Array.from(domsRef.current.entries());
            let targetId = domEntries.find(([id, dom]) => dom === target)?.[0] || null;

            if (!targetId) {
                let current = target;
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
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    dispatch({ type: "ADD_SELECTED", payload: targetId });
                } else {
                    dispatch({ type: "SET_SELECTED", payload: targetId });
                }
            } else {
                dispatch({ type: "CLEAR_SELECTED" });
            }
        }

        const onClick = (e: MouseEvent) => {
            if ((e.target as HTMLElement)?.closest("a")) {
                e.preventDefault();
            }
        }

        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(dom);
        resizeObserver.observe(document.body);

        iframeWindow.addEventListener("scroll", onScroll);
        iframeWindow.addEventListener("mousemove", onMouseEnter, true);
        iframeWindow.addEventListener("mouseleave", onMouseLeave, true);
        iframeWindow.addEventListener("mousedown", onMouseDown, true);
        iframeWindow.addEventListener("click", onClick, true);
        dom.addEventListener("mouseleave", onMouseLeave);

        return () => {
            resizeObserver.disconnect();
            iframeWindow.removeEventListener("scroll", onScroll);
            iframeWindow.removeEventListener("mousemove", onMouseEnter, true);
            iframeWindow.removeEventListener("mouseleave", onMouseLeave, true);
            iframeWindow.removeEventListener("mousedown", onMouseDown, true);
            iframeWindow.removeEventListener("click", onClick, true);
            dom.removeEventListener("mouseleave", onMouseLeave);
            clearTimeout(fadeInTimeout);
        }
    }, [dom, updateViewport, dispatch]);

    // Container Resize Observer
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onResize = () => {
            if (!container) return;
            setRect(container.getBoundingClientRect());
        }

        const resizeObserver = new ResizeObserver(onResize);
        resizeObserver.observe(container);

        // Initial set
        onResize();

        // Handle CSS transitions completing
        const onTransitionEnd = (e: TransitionEvent) => {
            // Ensure the transition that ended was on the container itself 
            // (or related size properties) to avoid firing on every child transition
            if (e.propertyName === 'width' || e.propertyName === 'height' || e.propertyName === 'transform') {
                onResize();
                updateViewport();
            }
        };

        container.addEventListener("transitionend", onTransitionEnd);

        return () => {
            resizeObserver.disconnect();
            container.removeEventListener("transitionend", onTransitionEnd);
            // window.removeEventListener("resize", onResize); // You didn't add this listener, so removing it does nothing.
        }
    }, [updateViewport]); // Added updateViewport to deps

    // Force viewport update when scale changes
    useEffect(() => {
        updateViewport();
    }, [scale, updateViewport]);

    useEffect(() => {
        if (!bodyNode) return;
        if (rootNode?.props.style) {
            Object.entries(rootNode.props.style).forEach(([key, value]) => {
                bodyNode.style.setProperty(key, String(value), "important");
            });
        }
    }, [rootNode?.props?.style, bodyNode]);

    return (
        <Container ref={containerRef} onClick={clearHoveredAndSelected}>
            <ScreenFrame sx={{
                opacity, width, height,
                transform: `translate(-50%, -50%) scale(${scale})`,
                transition: "opacity 0.3s ease, transform 0.3s ease"
            }}>
                <Iframe sx={{ ...rootNode?.props?.style }} ref={setDom} />
            </ScreenFrame>
            {isReady &&
                createPortal(
                    <CacheProvider value={cache}>
                        <ThemeProvider
                            theme={theme}
                            modeStorageKey={"theme-mode"}
                            disableTransitionOnChange>
                            <CssBaseline />
                            <Root dom={dom} />
                        </ThemeProvider>
                    </CacheProvider>,
                    bodyNode
                )}
        </Container>
    )
}
