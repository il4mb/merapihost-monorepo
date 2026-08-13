"use client";
import { useMemo, useEffect, useState } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { NodeModel } from "./NodeModel";
import InternalNode from "./InternalNode";

type NodeRenderProps = {
    node: NodeModel;
}

export default function NodeRender({ node }: NodeRenderProps) {

    const { state, dispatch } = useNodesReducer();
    const [dom, setDom] = useState<HTMLElement | null>(null);
    const isSelected = useMemo(() => {
        return state.selected.has(node.id);
    }, [node.id, state.selected]);

    const Component = useMemo(() => node.type.render, [node.type]);

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
        if (!dom || !node.type || !isSelected || state.status !== "editing") return;
        const isDraggable = typeof node.type.draggable === "function" ? node.type.draggable(node) : node.type.draggable;
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
            dom.removeAttribute("draggable");
        }
    }, [dom, node.type, node, isSelected, state.status]);

    if (node.visible === false) return null;

    // if "Root", render its children directly without any wrapper
    if (node.type.name === "Root") {
        return children;
    }

    if (Component) {
        return (
            <InternalNode node={node}>
                <Component node={node} ref={setDom}>
                    {children}
                </Component>
            </InternalNode>
        );
    }

    return (
        <div style={{ border: "1px solid red", padding: "8px", color: "red" }} ref={setDom}>
            Unknown type: {node.type.name} (id: {node.id})
        </div>
    );
}