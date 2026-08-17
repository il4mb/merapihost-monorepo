"use client";
import { useMemo, useEffect, useState, useRef } from "react";
import { useNodes } from "@/contexts";
import { NodeModel } from "./NodeModel";
import NodeInternal from "./NodeInternal";

type NodeRenderProps = {
    node: NodeModel;
}
export default function NodeRender({ node }: NodeRenderProps) {

    const { state, dispatch } = useNodes();
    const elementRef = useRef<HTMLElement | null>(null);

    const isVisible = useMemo(() => {
        return node.visible !== false;
    }, [node.visible]);

    const isSelected = useMemo(() => {
        return state.selected.has(node.id);
    }, [node.id, state.selected]);

    const isHovered = useMemo(() => {
        return state.hovered.has(node.id)
    }, [state.hovered, node.id]);

    useEffect(() => {

        const dom = elementRef.current;
        const isDraggable = node.type.isDraggable(node);

        if (!dom || state.status !== "editing" || !isDraggable || !node.data.isSelected) return;

        const handleDragStart = (e: DragEvent) => {
            // console.log("Drag Start")
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
            // dom.removeEventListener("mousedown", onMoseDown);
            dom.removeAttribute("draggable");
        }
    }, [node.data.isSelected, node, state.status]);

    useEffect(() => {
        dispatch({
            type: "UPDATE_NODE",
            payload: {
                id: node.id,
                dom: elementRef.current,
                data: { isSelected, isVisible, isHovered }
            }
        });
    }, [isSelected, isVisible, isHovered, node.id])

    if (!isVisible) return null;
    return (
        <NodeInternal ref={elementRef} node={node} />
    );
}