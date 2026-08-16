import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useRef, RefObject } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import DropIndicator from "@/components/screens/indicators/DropIndicator";
import { debounce } from "lodash";
import { Block } from "@/types";
import { NodeModel } from "@/libs/node";

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

const computeDropTarget = (rawTarget: HTMLElement, event: DragEvent, excludeElement?: HTMLElement): ComputeDropTargetResult | null => {
    let targetNode = rawTarget;
    let targetGeo = getGeometry(targetNode);
    let isHorizontal = checkIsHorizontal(targetNode);

    let insertPosition: "before" | "after" | "inside";
    const isVoidElement = /^(IMG|INPUT|BR|HR|AREA|BASE|COL|EMBED|PARAM|SOURCE|TRACK|WBR)$/i.test(targetNode.tagName);
    const validChildren = Array.from(targetNode.children).filter(
        (child) => child !== excludeElement
    ) as HTMLElement[];

    if (isVoidElement) {
        insertPosition = isHorizontal
            ? (event.clientX < targetGeo.midX ? "before" : "after")
            : (event.clientY < targetGeo.midY ? "before" : "after");
    } else if (validChildren.length === 0) {
        // Force 'inside' for empty divs/containers
        insertPosition = "inside";
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

    if (insertPosition === "inside" && validChildren.length > 0) {
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
    } else if (insertPosition === "inside" && validChildren.length === 0) {
        const containerStyle = window.getComputedStyle(targetNode);
        isHorizontal = (containerStyle.display === "flex" && containerStyle.flexDirection.includes("row")) ||
            containerStyle.display.includes("inline") ||
            containerStyle.gridAutoFlow === "column";
        // Do not mutate insertPosition here; it stays "inside"
    }

    return {
        targetEl: targetNode,
        position: insertPosition as "before" | "after" | "inside",
        isHorizontal,
    };
};

type ComputeDropTargetResult = {
    targetEl: HTMLElement;
    position: "before" | "after" | "inside";
    isHorizontal: boolean;
}
type DropTarget = {
    target: HTMLElement;
    position: "before" | "after" | "inside";
    direction: "horizontal" | "vertical";
}

interface DraggingProviderProps {
    children: ReactNode;
    isReady: boolean;
    iframe: HTMLIFrameElement | null;
    arrayNodeRef: RefObject<NodeModel[]>
}
export default function DraggingProvider({ children, iframe, isReady, arrayNodeRef }: DraggingProviderProps) {

    const { state, dispatch } = useStudio();

    const [dragging, setDragging] = useState(false);
    const [draggingClient, setDraggingClient] = useState(false);
    const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

    const draggingRef = useRef(false);
    const dropTargetRef = useRef<DropTarget | null>(null);
    const draggedBlockRef = useRef<Block | null>(null);
    const draggedBlockNodeRef = useRef<NodeModel | null>(null);
    // 1. Define the debouncer
    const updateDraggingClient = useMemo(() => debounce((isDragging: boolean) => {
        setDraggingClient(isDragging);
    }, 100), []);

    // 2. Clean up the debouncer on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            updateDraggingClient.cancel();
        };
    }, [updateDraggingClient]);

    // 3. Sync state (with immediate drag-end)
    useEffect(() => {
        draggingRef.current = dragging;

        if (!dragging) {
            // UX IMPROVEMENT: When the user drops the item, the UI should react instantly.
            // Cancel any pending debounced updates and set client state to false immediately.
            updateDraggingClient.cancel();
            setDraggingClient(false);
        } else {
            // Only delay the drag *start* to prevent flicker on quick clicks.
            updateDraggingClient(true);
        }
    }, [dragging, updateDraggingClient]);

    const handleNodeMoving = (sourceNodeId: string, event: DragEvent) => {
        event.preventDefault();

        const sourceNode = arrayNodeRef.current.find(n => n.id === sourceNodeId);
        const sourceElement = sourceNode?.dom;
        const rawTarget = event.target as HTMLElement;

        if (!rawTarget || !sourceElement) return;
        if (sourceElement.contains(rawTarget)) return;

        const resolved = computeDropTarget(rawTarget, event, sourceElement);
        if (!resolved) return;
        // console.log(resolved);

        const { targetEl: initialTargetEl, position: initialPosition, isHorizontal } = resolved;

        let currentEl: HTMLElement | null = initialTargetEl;
        let currentPosition: "before" | "after" | "inside" = initialPosition;
        let validDropTarget: { targetEl: HTMLElement; position: "before" | "after" | "inside" } | null = null;

        // Bubble up through parent DOM/nodes until an accepting container is found
        while (currentEl) {
            const currentTargetNode = arrayNodeRef.current.find(n => n.dom === currentEl);

            if (!currentTargetNode) {
                currentEl = currentEl.parentElement;
                continue;
            }

            // Prevent dropping a node onto itself or its descendants
            if (sourceNodeId === currentTargetNode.id || sourceElement.contains(currentEl)) {
                const parentNode = arrayNodeRef.current.find(n => n.id === currentTargetNode.parent);
                currentEl = parentNode?.dom || currentEl.parentElement;
                currentPosition = "after";
                continue;
            }

            // Determine the target container node that will receive the dropped node
            const containerNode = currentPosition === "inside"
                ? currentTargetNode
                : arrayNodeRef.current.find(n => n.id === currentTargetNode.parent);

            // Check if the container accepts the source node and if the source node can be dropped onto the container
            const isCanDrop = containerNode.type.isAccepted(sourceNode) && sourceNode.type.isDroppable(containerNode);
            // console.log(isCanDrop)
            if (containerNode && isCanDrop) {
                validDropTarget = { targetEl: currentEl, position: currentPosition };
                break; // Found a valid target!
            }

            // If rejected, attempt fallback strategies:
            if (currentPosition === "inside") {
                // 1. Fallback from 'inside' to 'before'/'after' relative to the current element
                const rect = currentEl.getBoundingClientRect();
                const mid = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
                const cursor = isHorizontal ? event.clientX : event.clientY;
                currentPosition = cursor < mid ? "before" : "after";
            } else {
                // 2. Bubble up to the parent element itself
                const parentNode = arrayNodeRef.current.find(n => n.id === currentTargetNode.parent);
                if (!parentNode || !parentNode.dom) break;

                currentEl = parentNode.dom;
                const rect = currentEl.getBoundingClientRect();
                const mid = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
                const cursor = isHorizontal ? event.clientX : event.clientY;
                currentPosition = cursor < mid ? "before" : "after";
            }
        }

        if (!validDropTarget) return;

        const { targetEl, position } = validDropTarget;

        // Check for no-op moves
        let isNoop = false;
        if (position === "before") {
            isNoop = sourceElement.nextElementSibling === targetEl;
        } else if (position === "after") {
            isNoop = targetEl.nextElementSibling === sourceElement;
        }

        if (isNoop) return;

        draggedBlockRef.current = null;

        setDropTarget((prev) => {
            if (prev && prev.target === targetEl && prev.position === position) return prev;
            return { target: targetEl, position, direction: isHorizontal ? "horizontal" : "vertical" };
        });
    };

    const handleBlockMoving = (block: Block, event: DragEvent) => {
        event.preventDefault();

        // 1. Cache blockNode during dragging to prevent re-building on every frame/pixel move
        if (!draggedBlockNodeRef.current || draggedBlockRef.current !== block) {
            draggedBlockNodeRef.current = NodeModel.build(block.content, null);
        }
        const blockNode = draggedBlockNodeRef.current;

        const rawTarget = event.target as HTMLElement;
        if (!rawTarget) return;
        const isIframeDoc = rawTarget.tagName === "HTML";

        const resolved = computeDropTarget(rawTarget, event);
        if (!resolved) return;

        const { targetEl: initialTargetEl, position: initialPosition, isHorizontal } = resolved;

        let currentEl: HTMLElement | null = initialTargetEl;
        let currentPosition: "before" | "after" | "inside" = initialPosition;
        let validDropTarget: { targetEl: HTMLElement; position: "before" | "after" | "inside" } | null = null;

        // Bubble up through parent DOM/nodes until an accepting container is found
        while (currentEl) {
            const currentTargetNode = isIframeDoc ?
                arrayNodeRef.current.find(n => n.id === "root") :
                arrayNodeRef.current.find(n => n.dom === currentEl);

            if (!currentTargetNode && !isIframeDoc) {
                currentEl = currentEl.parentElement;
                continue;
            }

            // Determine the target container node that will receive the dropped block
            const containerNode = isIframeDoc
                ? arrayNodeRef.current.find(n => n.id === "root")
                : currentPosition === "inside"
                    ? currentTargetNode
                    : arrayNodeRef.current.find(n => n.id === currentTargetNode.parent);

            // 2. Symmetric validation (both isAccepted and isDroppable checks)
            const isAccepted = containerNode
                && containerNode.type.isAccepted(blockNode)
                && blockNode.type.isDroppable(containerNode);

            if (isAccepted) {
                validDropTarget = { targetEl: currentEl, position: currentPosition };
                break; // Found a valid target!
            }

            // If rejected, attempt fallback strategies:
            if (currentPosition === "inside") {
                // Fallback from 'inside' to 'before'/'after' relative to the current element
                const rect = currentEl.getBoundingClientRect();
                const mid = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
                const cursor = isHorizontal ? event.clientX : event.clientY;
                currentPosition = cursor < mid ? "before" : "after";
            } else {
                // Bubble up to the parent element itself
                const parentNode = arrayNodeRef.current.find(n => n.id === currentTargetNode.parent);
                if (!parentNode || !parentNode.dom) break;

                currentEl = parentNode.dom;
                const rect = currentEl.getBoundingClientRect();
                const mid = isHorizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
                const cursor = isHorizontal ? event.clientX : event.clientY;
                currentPosition = cursor < mid ? "before" : "after";
            }
        }

        if (!validDropTarget) return;

        const { targetEl, position } = validDropTarget;

        draggedBlockRef.current = block;

        setDropTarget((prev) => {
            if (prev && prev.target === targetEl && prev.position === position) return prev;
            return { target: targetEl, position, direction: isHorizontal ? "horizontal" : "vertical" };
        });
    };

    const handleClearDropTarget = () => {
        setDropTarget(null);
        draggedBlockRef.current = null;
        draggedBlockNodeRef.current = null;
    };

    useEffect(() => {
        dropTargetRef.current = dropTarget;
    }, [dropTarget]);

    useEffect(() => {
        if (!iframe || !isReady) return;
        const iframeWindow = iframe.contentWindow;
        const iframeDocument = iframe.contentDocument;
        if (!iframeWindow || !iframeDocument) return;


        const onDragOver = (e: DragEvent) => {
            e.preventDefault();
            setDragging(true);
            if (state.nodes.status !== "editing") return;
            const dt = e.dataTransfer;
            if (!dt) return;

            const draggedNodeId = dt.getData("studio/node");
            const draggedBlockData = dt.getData("studio/block");

            if (draggedNodeId) {
                handleNodeMoving(draggedNodeId, e);
            } else if (draggedBlockData) {
                const block: Block = JSON.parse(draggedBlockData);
                handleBlockMoving(block, e);
            }
        };

        const onDrop = (e: DragEvent) => {
            e.preventDefault();
            setDragging(false);
            if (state.nodes.status !== "editing") return;

            const dt = e.dataTransfer;
            if (!dt) return;

            const draggedNodeId = dt.getData("studio/node");
            const draggedBlockData = dt.getData("studio/block");

            if (draggedNodeId && dropTargetRef.current) {
                const { target, position } = dropTargetRef.current;
                const targetNode = arrayNodeRef.current.find((node) => node.dom === target);
                const targetId = targetNode ? targetNode.id : null;
                if (targetId) {
                    dispatch({
                        type: "MOVE_NODE",
                        payload: { sourceId: draggedNodeId, targetId, position },
                    });
                }
            } else if (draggedBlockData && dropTargetRef.current && draggedBlockRef.current) {
                const { target, position } = dropTargetRef.current;
                const targetNode = arrayNodeRef.current.find((node) => node.dom === target);
                const targetId = targetNode ? targetNode.id : null;
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
            setDragging(false);
            handleClearDropTarget();
        };

        const onDragStart = () => setDragging(true);
        const onDragEnd = () => {
            setDragging(false);
            handleClearDropTarget();
        }


        const attachIframeListeners = () => {
            iframeWindow.addEventListener("dragstart", onDragStart, true);
            iframeWindow.addEventListener("dragend", onDragEnd, true);
            iframeWindow.addEventListener("dragover", onDragOver, true);
            iframeWindow.addEventListener("dragleave", onDragLeave, true);
            iframeWindow.addEventListener("drop", onDrop, true);
        };

        const detachIframeListeners = () => {
            iframeWindow.removeEventListener("dragstart", onDragStart, true);
            iframeWindow.removeEventListener("dragend", onDragEnd, true);
            iframeWindow.removeEventListener("dragover", onDragOver, true);
            iframeWindow.removeEventListener("dragleave", onDragLeave, true);
            iframeWindow.removeEventListener("drop", onDrop, true);
        };

        attachIframeListeners();
        return () => {
            detachIframeListeners();
        };
    }, [iframe, dispatch, isReady, state.nodes.status]);


    const values = useMemo<DraggingContext>(() => ({
        iframe,
        dragging: draggingClient
    }), [iframe, draggingClient]);

    return (
        <Context.Provider value={values}>
            {children}
            {dropTarget && (
                <DropIndicator
                    target={dropTarget.target}
                    position={dropTarget.position}
                    direction={dropTarget.direction}
                />
            )}
        </Context.Provider>
    )
}

export interface DraggingContext {
    dragging: boolean;
}
const Context = createContext<DraggingContext | undefined>(undefined);

export const useDragging = () => {
    const ctx = useContext(Context);
    if (!ctx) {
        throw new Error("useDragging must be used within an DraggingProvider");
    }
    return ctx;
}