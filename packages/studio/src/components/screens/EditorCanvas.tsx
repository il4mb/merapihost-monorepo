"use client";
import { inputsCustomizations, dataDisplayCustomizations, feedbackCustomizations, navigationCustomizations, surfacesCustomizations } from '@/theme/customizations';
import { colorSchemes, typography, shadows, shape } from '@/theme/themePrimitives';
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, Box } from "@mui/material";
import DropIndicator from "./DropIndicator";
import createCache from "@emotion/cache";
import { createPortal } from "react-dom";
import { RootNode } from "@/libs/node";
import { Block, NodeObject } from "@/types";
import { debounce } from "lodash";
import SpotsContainer from "./SpotsContainer";
import { useGlobalKeyListener, useMainShortcutListener } from '@/hooks';

const getGeometry = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return {
        element: el,
        rect,
        midX: rect.left + rect.width / 2,
        midY: rect.top + rect.height / 2,
    };
};

const proportionalDelta = (a: DOMRect, b: DOMRect) => {
    const deltaX = Math.abs(a.left - b.left);
    const deltaY = Math.abs(a.top - b.top);
    return {
        normDeltaX: deltaX / Math.max(a.width, b.width, 1),
        normDeltaY: deltaY / Math.max(a.height, b.height, 1),
    };
};

const checkIsHorizontal = (el: HTMLElement): boolean => {
    const parent = el.parentElement;
    if (!parent) return false;

    const visibleSiblings = Array.from(parent.children).filter(
        (child) => child !== el && (child as HTMLElement).offsetWidth > 0 && (child as HTMLElement).offsetHeight > 0
    ) as HTMLElement[];

    if (visibleSiblings.length > 0) {
        const elRect = el.getBoundingClientRect();
        const prev = el.previousElementSibling as HTMLElement | null;
        const next = el.nextElementSibling as HTMLElement | null;
        const neighbors = [prev, next].filter(
            (n): n is HTMLElement => !!n && visibleSiblings.includes(n)
        );
        const candidates = neighbors.length > 0 ? neighbors : visibleSiblings.slice(0, 1);

        let horizontalVotes = 0;
        let verticalVotes = 0;

        for (const sib of candidates) {
            const sibRect = sib.getBoundingClientRect();
            const { normDeltaX, normDeltaY } = proportionalDelta(elRect, sibRect);
            if (normDeltaX !== normDeltaY) {
                if (normDeltaX > normDeltaY) horizontalVotes++;
                else verticalVotes++;
            }
        }

        if (horizontalVotes !== verticalVotes) {
            return horizontalVotes > verticalVotes;
        }
    }

    const parentStyle = window.getComputedStyle(parent);
    return (
        (parentStyle.display === "flex" && parentStyle.flexDirection.includes("row")) ||
        parentStyle.display.includes("inline") ||
        parentStyle.gridAutoFlow === "column"
    );
};

const checkContainerIsHorizontal = (container: HTMLElement, children: HTMLElement[]): boolean => {
    if (children.length >= 2) {
        let horizontalVotes = 0;
        let verticalVotes = 0;

        for (let i = 0; i < children.length - 1; i++) {
            const a = children[i].getBoundingClientRect();
            const b = children[i + 1].getBoundingClientRect();
            const { normDeltaX, normDeltaY } = proportionalDelta(a, b);
            if (normDeltaX !== normDeltaY) {
                if (normDeltaX > normDeltaY) horizontalVotes++;
                else verticalVotes++;
            }
        }

        if (horizontalVotes !== verticalVotes) {
            return horizontalVotes > verticalVotes;
        }
    }

    const containerStyle = window.getComputedStyle(container);
    return (
        (containerStyle.display === "flex" && containerStyle.flexDirection.includes("row")) ||
        containerStyle.display.includes("inline") ||
        containerStyle.gridAutoFlow === "column"
    );
};

type ComputeDropTargetResult = {
    targetNode: HTMLElement;
    position: "before" | "after";
    isHorizontal: boolean;
}
const computeDropTarget = (rawTarget: HTMLElement, event: DragEvent, excludeElement?: HTMLElement): ComputeDropTargetResult | null => {

    let targetNode = rawTarget;
    let targetGeo = getGeometry(targetNode);
    let isHorizontal = checkIsHorizontal(targetNode);

    let insertPosition: "before" | "after" | "inside";
    const isVoidElement = /^(IMG|INPUT|BR|HR|AREA|BASE|COL|EMBED|PARAM|SOURCE|TRACK|WBR)$/i.test(targetNode.tagName);

    if (isVoidElement) {
        insertPosition = isHorizontal
            ? (event.clientX < targetGeo.midX ? "before" : "after")
            : (event.clientY < targetGeo.midY ? "before" : "after");
    } else {
        const edgeThreshold = 0.25;
        const maxEdgePx = 24;

        if (isHorizontal) {
            const thresholdPx = Math.min(targetGeo.rect.width * edgeThreshold, maxEdgePx);
            if (event.clientX < targetGeo.rect.left + thresholdPx) insertPosition = "before";
            else if (event.clientX > targetGeo.rect.right - thresholdPx) insertPosition = "after";
            else insertPosition = "inside";
        } else {
            const thresholdPx = Math.min(targetGeo.rect.height * edgeThreshold, maxEdgePx);
            if (event.clientY < targetGeo.rect.top + thresholdPx) insertPosition = "before";
            else if (event.clientY > targetGeo.rect.bottom - thresholdPx) insertPosition = "after";
            else insertPosition = "inside";
        }
    }

    if (insertPosition === "inside") {
        const validChildren = Array.from(targetNode.children).filter(
            (child) => child !== excludeElement
        ) as HTMLElement[];

        if (validChildren.length > 0) {
            const childrenGeometries = validChildren.map((child) => getGeometry(child));
            const isContainerHorizontal = checkContainerIsHorizontal(targetNode, validChildren);

            let closestChildGeo: typeof childrenGeometries[0] | null = null;
            let minDistance = Infinity;

            for (const childGeo of childrenGeometries) {
                const distance = Math.hypot(event.clientX - childGeo.midX, event.clientY - childGeo.midY);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestChildGeo = childGeo;
                }
            }

            if (closestChildGeo) {
                targetNode = closestChildGeo.element;
                targetGeo = closestChildGeo;
                isHorizontal = isContainerHorizontal;
                insertPosition = isContainerHorizontal
                    ? (event.clientX < targetGeo.midX ? "before" : "after")
                    : (event.clientY < targetGeo.midY ? "before" : "after");
            }
        } else {
            const containerStyle = window.getComputedStyle(targetNode);
            const isContainerHorizontal =
                (containerStyle.display === "flex" && containerStyle.flexDirection.includes("row")) ||
                containerStyle.display.includes("inline") ||
                containerStyle.gridAutoFlow === "column";

            isHorizontal = isContainerHorizontal;
            insertPosition = isContainerHorizontal
                ? (event.clientX < targetGeo.midX ? "before" : "after")
                : (event.clientY < targetGeo.midY ? "before" : "after");
        }
    }

    return {
        targetNode,
        position: insertPosition as "before" | "after",
        isHorizontal,
    };
};


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


type DropTarget = {
    target: HTMLElement;
    position: "before" | "after";
    direction: "horizontal" | "vertical";
}
type EditorCanvasProps = {
    nodes: NodeObject[];
};

export default function EditorCanvas({ nodes }: EditorCanvasProps) {

    const { state, dispatch } = useStudio();
    const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
    const [isReady, setIsReady] = useState(false); // Track iframe load state
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null); // Track the current drop target
    const domsRef = useRef<Map<string, HTMLElement>>(new Map()); // Store DOM elements for each node
    const arrayNodeRef = useRef<NodeObject[]>([]); // Store the array of nodes for comparison
    const dropTargetRef = useRef<DropTarget | null>(null); // Store the current drop target for comparison
    const draggedBlockRef = useRef<Block | null>(null);

    const shortcuts = useMainShortcutListener();

    useGlobalKeyListener(iframe?.contentWindow, shortcuts); // Listen for global key events in the iframe

    const handleNodeMoving = (sourceNodeId: string, event: DragEvent) => {
        event.preventDefault();

        const sourceElement = domsRef.current.get(sourceNodeId);
        const rawTarget = event.target as HTMLElement;
        if (!rawTarget || !sourceElement) return;

        if (sourceElement.contains(rawTarget)) return;

        const resolved = computeDropTarget(rawTarget, event, sourceElement);
        if (!resolved) return;

        const { targetNode, position, isHorizontal } = resolved;

        const isNoop = position === "before"
            ? sourceElement.nextElementSibling === targetNode
            : targetNode.nextElementSibling === sourceElement;

        if (isNoop) return;

        draggedBlockRef.current = null; // this drag is a node move, not a block insert

        setDropTarget((prev) => {
            if (prev && prev.target === targetNode && prev.position === position) return prev;
            return { target: targetNode, position, direction: isHorizontal ? "horizontal" : "vertical" };
        });
    };

    const handleBlockMoving = (block: Block, event: DragEvent) => {
        event.preventDefault();

        const rawTarget = event.target as HTMLElement;
        if (!rawTarget) return;

        const resolved = computeDropTarget(rawTarget, event);
        if (!resolved) return;

        const { targetNode, position, isHorizontal } = resolved;

        draggedBlockRef.current = block;

        setDropTarget((prev) => {
            if (prev && prev.target === targetNode && prev.position === position) return prev;
            return { target: targetNode, position, direction: isHorizontal ? "horizontal" : "vertical" };
        });
    };

    const handleClearDropTarget = () => {
        setDropTarget(null);
        draggedBlockRef.current = null;
    };

    // Keep dropTargetRef in sync for event handlers to access
    useEffect(() => {
        dropTargetRef.current = dropTarget;
    }, [dropTarget]);

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

        const updateViewport = () => {
            if (!iframeWindow) return;
            const scrollLeft = iframeWindow.scrollX;
            const scrollTop = iframeWindow.scrollY;
            const rect = iframeWindow.document.documentElement.getBoundingClientRect();
            dispatch({
                type: "UPDATE_VIEWPORT",
                payload: {
                    width: rect.width,
                    height: rect.height,
                    scroll: { x: scrollLeft, y: scrollTop },
                    edge: {
                        top: rect.top,
                        left: rect.left,
                        bottom: rect.bottom,
                        right: rect.right
                    },
                    iframe: iframe
                }
            });
        }

        const onMouseEnter = debounce((e: MouseEvent) => {
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
                    };
                };
            };

            if (targetId) {
                dispatch({ type: "SET_HOVERED", payload: targetId });
            } else {
                dispatch({ type: "CLEAR_HOVERED" });
            }
        }, 100);

        const onMouseLeave = debounce(() => {
            dispatch({ type: "CLEAR_HOVERED" });
        }, 100);

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
                    };
                };
            };

            if (targetId) {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    dispatch({
                        type: "ADD_SELECTED",
                        payload: targetId
                    });
                } else {
                    dispatch({
                        type: "SET_SELECTED",
                        payload: targetId
                    });
                }
            } else {
                dispatch({ type: "CLEAR_SELECTED" });
            }
        };

        const onDragOver = (e: DragEvent) => {
            e.preventDefault();

            const dataTransfer = e.dataTransfer;
            if (!dataTransfer) return;

            const draggedNodeId = dataTransfer.getData("studio/node");
            const draggedBlockData = dataTransfer.getData("studio/block");

            if (draggedNodeId) {
                handleNodeMoving(draggedNodeId, e);
            } else if (draggedBlockData) {
                const block: Block = JSON.parse(draggedBlockData);
                handleBlockMoving(block, e);
            }
        };

        const onDrop = (e: DragEvent) => {
            e.preventDefault();
            const dataTransfer = e.dataTransfer;
            if (!dataTransfer) return;

            const draggedNodeId = dataTransfer.getData("studio/node");
            const draggedBlockData = dataTransfer.getData("studio/block");

            if (draggedNodeId && dropTargetRef.current) {
                const { target, position } = dropTargetRef.current;
                const targetId = Array.from(domsRef.current.entries()).find(([id, dom]) => dom === target)?.[0];
                if (targetId) {
                    dispatch({
                        type: "MOVE_NODE",
                        payload: { sourceId: draggedNodeId, targetId, position },
                    });
                }
            } else if (draggedBlockData && dropTargetRef.current && draggedBlockRef.current) {
                const { target, position } = dropTargetRef.current;
                const targetId = Array.from(domsRef.current.entries()).find(([id, dom]) => dom === target)?.[0];
                if (targetId) {
                    dispatch({
                        type: "INSERT_BLOCK",
                        payload: {
                            block: draggedBlockRef.current,
                            targetId,
                            position
                        },
                    });
                }
            }

            handleClearDropTarget();
        };

        const onDragLeave = (e: DragEvent) => {
            e.preventDefault();
            handleClearDropTarget();
        };

        window.addEventListener("resize", updateViewport);
        iframeWindow.addEventListener("scroll", updateViewport, true);
        iframeWindow.addEventListener("resize", updateViewport, true);
        iframeWindow.addEventListener("click", preventAnchorNavigation, true);
        iframeWindow.addEventListener("mouseenter", onMouseEnter, true);
        iframeWindow.addEventListener("mouseleave", onMouseLeave, true);
        iframeWindow.addEventListener("mousedown", onMouseDown, true);
        iframeWindow.addEventListener("dragover", onDragOver, true);
        iframeWindow.addEventListener("dragleave", onDragLeave, true);
        iframeWindow.addEventListener("drop", onDrop, true);
        return () => {
            window.removeEventListener("resize", updateViewport);
            iframeWindow.removeEventListener("scroll", updateViewport, true);
            iframeWindow.removeEventListener("resize", updateViewport, true);
            iframeWindow.removeEventListener("click", preventAnchorNavigation, true);
            iframeWindow.removeEventListener("mouseenter", onMouseEnter, true);
            iframeWindow.removeEventListener("mouseleave", onMouseLeave, true);
            iframeWindow.removeEventListener("mousedown", onMouseDown, true);
            iframeWindow.removeEventListener("dragover", onDragOver, true);
            iframeWindow.removeEventListener("dragleave", onDragLeave, true);
            iframeWindow.removeEventListener("drop", onDrop, true);
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
                        {dropTarget && (
                            <DropIndicator
                                target={dropTarget.target}
                                position={dropTarget.position}
                                direction={dropTarget.direction}
                            />
                        )}
                    </ThemeProvider>
                </CacheProvider>,
                iframe.contentDocument.body
            )}
            <SpotsContainer />
        </Fragment>
    );
}