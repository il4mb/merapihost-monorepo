"use client";
import { inputsCustomizations, dataDisplayCustomizations, feedbackCustomizations, navigationCustomizations, surfacesCustomizations } from '@/theme/customizations';
import { colorSchemes, typography, shadows, shape } from '@/theme/themePrimitives';
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, Box } from "@mui/material";
import createCache from "@emotion/cache";
import { createPortal } from "react-dom";
import { RootNode } from "@/libs/node";
import { NodeObject } from "@/types";


const Iframe = styled("iframe")({
    width: "100%",
    height: "100%",
    border: "none",
    overflow: "hidden",
    borderRadius: "8px",
    backgroundColor: "white",
    pointerEvents: "all", // Prevents interaction with the iframe content
});

// MUI ThemeProvider expects a compiled theme object via createTheme()
const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'color-scheme',
        cssVarPrefix: 'merapi-studio',
    },
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
});

type EditorCanvasProps = {
    nodes: NodeObject[];
};

export default function EditorCanvas({ nodes }: EditorCanvasProps) {
    const { state, dispatch } = useStudio();
    const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
    const [isReady, setIsReady] = useState(false); // Track iframe load state
    const domsRef = useRef<Map<string, HTMLElement>>(new Map()); // Store DOM elements for each node
    const arrayNodeRef = useRef<NodeObject[]>([]); // Store the array of nodes for comparison

    // Keep domsRef synced for event listeners
    useEffect(() => {
        domsRef.current = state.doms;
    }, [state.doms]);

    // Keep a ref to the latest nodes array for event handlers to access
    useEffect(() => {
        arrayNodeRef.current = Array.from(state.nodes.values());
    }, [state.nodes]);

    // Wait for the iframe's document to fully initialize
    useEffect(() => {
        if (!iframe) return;

        const handleLoad = () => {
            if (iframe.contentDocument?.head && iframe.contentDocument?.body) {
                setIsReady(true);
            }
        };

        iframe.addEventListener("load", handleLoad);

        // Check immediately in case it loaded before the event listener was attached
        if (iframe.contentDocument?.readyState === "complete") {
            handleLoad();
        }

        return () => iframe.removeEventListener("load", handleLoad);
    }, [iframe]);

    // Prevent default navigation for anchor tags within the iframe
    useEffect(() => {
        if (!iframe || !isReady) return;
        const iframeWindow = iframe.contentWindow;
        const iframeDocument = iframe.contentDocument;
        if (!iframeWindow || !iframeDocument) return;

        const preventAnchorNavigation = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target) return;
            const anchor = target.closest('a');
            if (anchor) {
                event.preventDefault();
                console.log(`Navigation prevented for anchor: ${anchor.href}`);
            }
        };
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

        iframeWindow.addEventListener("click", preventAnchorNavigation, true);
        iframeWindow.addEventListener("mouseenter", onMouseEnter, true);
        iframeWindow.addEventListener("mouseleave", onMouseLeave, true);
        iframeWindow.addEventListener("mousedown", onMouseDown, true);
        return () => {
            iframeWindow.removeEventListener("click", preventAnchorNavigation, true);
            iframeWindow.removeEventListener("mouseenter", onMouseEnter, true);
            iframeWindow.removeEventListener("mouseleave", onMouseLeave, true);
            iframeWindow.removeEventListener("mousedown", onMouseDown, true);
        }
    }, [iframe, dispatch, isReady]);

    // Only create the Emotion cache once the iframe's <head> is definitely available
    const cache = useMemo(() => {
        if (!isReady || !iframe?.contentDocument?.head) return null;
        return createCache({
            key: "merapi-studio",
            container: iframe.contentDocument.head
        });
    }, [isReady, iframe]);

    useEffect(() => {
        const nodeMap = new Map<string, NodeObject>();
        nodes.forEach(node => {
            nodeMap.set(node.id, node);
        });
        dispatch({
            type: "SET_NODES",
            payload: nodeMap
        });
    }, [nodes, dispatch]);

    return (
        <Fragment>
            <Iframe
                ref={setIframe}
                srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
                onDragOver={(e) => (e.preventDefault(), console.log("Dropped!"))}
                onDrop={(e) => (e.preventDefault(), console.log("Dropped!"))}
                sandbox="allow-scripts allow-same-origin"
            />
            {(isReady && cache && iframe?.contentDocument?.body) && createPortal(
                <CacheProvider value={cache}>
                    <ThemeProvider
                        theme={theme}
                        modeStorageKey={"theme-mode"}
                        disableTransitionOnChange>
                        <CssBaseline />
                        <RootNode dom={iframe} />
                    </ThemeProvider>
                </CacheProvider>,
                iframe.contentDocument.body
            )}
        </Fragment>
    );
}