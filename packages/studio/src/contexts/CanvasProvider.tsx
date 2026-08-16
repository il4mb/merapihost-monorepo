import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { debounce } from "lodash";
import { useArrayNodeRef } from "@/hooks/useNodes";
import DraggingProvider from "@/contexts/DraggingProvider";

interface CanvasProviderProps {
    children: ReactNode;
    isReady: boolean;
    iframe: HTMLIFrameElement | null;
}
export default function CanvasProvider({ children, iframe, isReady }: CanvasProviderProps) {

    const { dispatch } = useStudio();
    const arrayNodeRef = useArrayNodeRef();

    const values = useMemo<CanvasContext>(() => ({
        iframe
    }), [iframe]);

    useEffect(() => {
        if (!iframe || !isReady) return;
        const iframeWindow = iframe.contentWindow;
        const iframeDocument = iframe.contentDocument;
        if (!iframeWindow || !iframeDocument) return;

        iframeWindow.document.documentElement.style.minHeight = "100vh";
        let isDragging = false;

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
                    edge: { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right },
                    iframe: iframe
                }
            });
        };

        const onMouseEnter = debounce((e: MouseEvent) => {
            const arrayNode = arrayNodeRef.current;
            const target = e.target as HTMLElement;
            let targetNode = arrayNode.find((node) => node.dom === target);

            if (!targetNode) {
                let current: HTMLElement | null = target;
                if (current === iframeDocument?.body) {
                    targetNode = arrayNode.find((node) => node.id === "root") || undefined;
                } else {
                    while (current && current !== iframeDocument?.body) {
                        targetNode = arrayNode.find((node) => node.dom === current);
                        if (targetNode) break;
                        current = current.parentElement as HTMLElement | null;
                    }
                }
            }
            if (targetNode && !targetNode.hoverable) {
                return; // Ignore hover on non-hoverable nodes
            }
            if (targetNode) {
                dispatch({ type: "SET_HOVERED", payload: targetNode.id });
            } else {
                dispatch({ type: "CLEAR_HOVERED" });
            }

        }, 100);

        const onMouseLeave = debounce(() => {
            dispatch({ type: "CLEAR_HOVERED" });
        }, 100);

        const onMouseUp = (e: MouseEvent) => {
            // If the user was dragging, abort the selection logic
            if (isDragging) return;

            const target = e.target as HTMLElement;
            const arrayNode = arrayNodeRef.current;
            let targetNode = arrayNode.find((node) => node.dom === target);

            if (!targetNode) {
                let current: HTMLElement | null = target;
                if (current === iframeDocument?.body) {
                    targetNode = arrayNode.find((node) => node.id === "root") || undefined;
                } else {
                    while (current && current !== iframeDocument?.body) {
                        targetNode = arrayNode.find((node) => node.dom === current);
                        if (targetNode) break;
                        current = current.parentElement as HTMLElement | null;
                    }
                }
            }

            if (targetNode && !targetNode.selectable) {
                return;
            }

            if (targetNode) {
                if (e.shiftKey || e.ctrlKey || e.metaKey) {
                    dispatch({ type: "ADD_SELECTED", payload: targetNode.id });
                } else {
                    dispatch({ type: "SET_SELECTED", payload: targetNode.id });
                }
            } else {
                dispatch({ type: "CLEAR_SELECTED" });
            }
        };

        window.addEventListener("resize", updateViewport);

        const attachIframeListeners = () => {
            iframeWindow.addEventListener("scroll", updateViewport, true);
            iframeWindow.addEventListener("resize", updateViewport, true);
            iframeWindow.addEventListener("click", preventAnchorNavigation, true);
            iframeWindow.addEventListener("mouseenter", onMouseEnter, true);
            iframeWindow.addEventListener("mouseleave", onMouseLeave, true);
            iframeWindow.addEventListener("mouseup", onMouseUp, true);
        };

        const detachIframeListeners = () => {
            iframeWindow.removeEventListener("scroll", updateViewport, true);
            iframeWindow.removeEventListener("resize", updateViewport, true);
            iframeWindow.removeEventListener("click", preventAnchorNavigation, true);
            iframeWindow.removeEventListener("mouseenter", onMouseEnter, true);
            iframeWindow.removeEventListener("mouseleave", onMouseLeave, true);
            iframeWindow.removeEventListener("mouseup", onMouseUp, true);
        };

        attachIframeListeners();

        return () => {
            window.removeEventListener("resize", updateViewport);
            detachIframeListeners();
            onMouseEnter.cancel();
            onMouseLeave.cancel();
        };
    }, [iframe, isReady]);

    return (
        <DraggingProvider iframe={iframe} isReady={isReady} arrayNodeRef={arrayNodeRef}>
            <Context.Provider value={values}>
                {children}
            </Context.Provider>
        </DraggingProvider>
    );
}

export interface CanvasContext {
    iframe: HTMLIFrameElement | null;
}
const Context = createContext<CanvasContext | undefined>(undefined);

export const useCanvas = () => {
    const ctx = useContext(Context);
    if (!ctx) {
        throw new Error("useCanvas must be used within an CanvasProvider");
    }
    return ctx;
}