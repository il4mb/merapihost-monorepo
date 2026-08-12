"use client";
import { useMemo, useEffect, useState } from "react";
import { NodeObject } from "@/types";
import { useNodesReducer, useStudio } from "@/contexts/StudioProvider";
import { REGISTRY } from "./index";

type NodeRenderProps = {
    node: NodeObject;
}

export default function NodeRender({ node }: NodeRenderProps) {

    const { state, dispatch } = useNodesReducer();
    const [dom, setDom] = useState<HTMLElement | null>(null);

    const Component = useMemo(() => {
        if (!node.type) return null;
        return REGISTRY[node.type] || null;
    }, [node.type]);

    const typeModel = useMemo(() => {
        if ("model" in Component && Component.model) {
            return Component.model;
        }
        return null;
    }, [Component]);

    const childrenNode = useMemo(() => {
        const id = node.id;
        return Array.from(state.collection.values())
            .filter(n => n.parent === id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [state.collection, node.id]);

    const children = childrenNode.map(n => <NodeRender key={n.id} node={n} />);

    useEffect(() => {
        if (!dom) return;
        dispatch({ type: "SET_DOM", payload: { id: node.id, dom } });
        return () => {
            dispatch({ type: "REMOVE_DOM", payload: node.id });
        }
    }, [dom, node.id, dispatch]);

    useEffect(() => {
        if (!dom || !typeModel) return;
        const isDraggable = typeof typeModel.draggable === "function" ? typeModel.draggable(node) : typeModel.draggable;
        const handleDragStart = (e: DragEvent) => {
            e.stopPropagation();
            e.dataTransfer?.setData("studio/node", node.id);
        };
        const handleDragEnd = (e: DragEvent) => {
            e.stopPropagation();
        };
        if (isDraggable) {
            dom.setAttribute("draggable", "true");
            dom.addEventListener("dragstart", handleDragStart);
            dom.addEventListener("dragend", handleDragEnd);
        } else {
            dom.removeAttribute("draggable");
            dom.removeEventListener("dragstart", handleDragStart);
            dom.removeEventListener("dragend", handleDragEnd);
        }
        return () => {
            dom.removeEventListener("dragstart", handleDragStart);
            dom.removeEventListener("dragend", handleDragEnd);
        }
    }, [dom, typeModel, node]);

    if (node.visible === false) return null;

    // if "Root", render its children directly without any wrapper
    if (node.type === "Root") {
        return children;
    }

    if (Component) {
        return (
            // @ts-ignore
            <Component node={node} ref={setDom}>
                {children}
            </Component>
        );
    }

    return (
        <div style={{ border: "1px solid red", padding: "8px", color: "red" }} ref={setDom}>
            Unknown type: {node.type || "undefined"} (id: {node.id})
        </div>
    );
}