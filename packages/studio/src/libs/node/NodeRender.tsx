"use client";
import { useMemo, useEffect, useState, useRef } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { NodeModel } from "./NodeModel";

type NodeRenderProps = {
    node: NodeModel;
}
export default function NodeRender({ node }: NodeRenderProps) {

    const { state, dispatch } = useNodesReducer();
    const elementRef = useRef<HTMLElement | null>(null);
    const [dom, setDom] = useState<HTMLElement | null>(null);

    const isVisible = useMemo(() => {
        return node.visible !== false;
    }, [node.visible]);

    const isSelected = useMemo(() => {
        return state.selected.has(node.id);
    }, [node.id, state.selected]);

    const isHovered = useMemo(() => {
        return state.hovered.has(node.id)
    }, [state.hovered, node.id]);

    const Component = useMemo(() => node.type.render, [node.type]);

    const childrenNode = useMemo(() => {
        const id = node.id;
        return Array.from(state.collection.values())
            .filter(n => n.parent === id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [state.collection, node.id]);

    const children = childrenNode.map(n => <NodeRender key={n.id} node={n} />);

    useEffect(() => {
        const isDraggable = node.type.isDraggable(node);
        if (!dom || state.status !== "editing" || !isDraggable || !node.data.isSelected) return;
        const handleDragStart = (e: DragEvent) => {
            e.stopPropagation();
            e.dataTransfer?.setData("studio/node", node.id);
        };
        const handleDragEnd = (e: DragEvent) => {
            e.stopPropagation();
        };
        dom.setAttribute("draggable", "true");
        dom.addEventListener("dragstart", handleDragStart);
        dom.addEventListener("dragend", handleDragEnd);

        return () => {
            dom.removeEventListener("dragstart", handleDragStart);
            dom.removeEventListener("dragend", handleDragEnd);
            dom.removeAttribute("draggable");
        }
    }, [dom, node.data.isSelected, node, state.status]);


    useEffect(() => {
        dispatch({
            type: "UPDATE_NODE",
            payload: {
                id: node.id,
                dom,
                data: { isSelected, isVisible, isHovered }
            }
        });
    }, [isSelected, isVisible, isHovered, dom, node.id])

    useEffect(() => {
        setDom(elementRef.current);
    }, [elementRef.current]);

    if (!isVisible) return null;

    // if "Root", render its children directly without any wrapper
    if (node.type.name === "Root") {
        return children;
    }

    if (Component) {
        return (
            <Component node={node} ref={elementRef} childrenNode={childrenNode}>
                {children}
            </Component>
        );
    }

    return (
        <div style={{ border: "1px solid red", padding: "8px", color: "red" }} ref={setDom}>
            Unknown type: {node.type.name} (id: {node.id})
        </div>
    );
}