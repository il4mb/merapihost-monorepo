"use client";
import { useMemo, useEffect, useState, useRef } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { NodeModel } from "./NodeModel";
import InternalNode from "./InternalNode";
import { TypeModelData } from "@/types";
import { isEqual, merge } from "lodash";

const INITIAL_DATA: TypeModelData = {
    isSelected: false,
    isDraggable: false,
    isVisible: true
};
type NodeRenderProps = {
    node: NodeModel;
    data?: TypeModelData;
}

export default function NodeRender({ node, data: initialData }: NodeRenderProps) {

    const { state, dispatch } = useNodesReducer();
    const elementRef = useRef<HTMLElement | null>(null);
    const [dom, setDom] = useState<HTMLElement | null>(null);
    const [data, setData] = useState<TypeModelData>(() => merge({}, INITIAL_DATA, initialData || {}));
    const isVisible = useMemo(() => {
        return node.visible !== false;
    }, [node.visible]);
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
        setData(prevData => {
            const nextData: TypeModelData = {
                ...node.type.data,
                isSelected,
                isDraggable: node.type.isDraggable(node),
                isVisible
            };
            if (!isEqual(prevData, nextData)) {
                return nextData;
            }
            return prevData;
        });
    }, [isSelected, isVisible, node.type, node]);

    useEffect(() => {
        if (!dom) return;
        dispatch({ type: "SET_DOM", payload: { id: node.id, dom } });
        return () => {
            dispatch({ type: "REMOVE_DOM", payload: node.id });
        }
    }, [dom, node.id, dispatch]);

    useEffect(() => {
        if (!dom || state.status !== "editing" || !data.isDraggable || !data.isSelected) return;
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
    }, [dom, data.isDraggable, data.isSelected, node.id, state.status]);

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
            <InternalNode node={node} data={data} setData={setData}>
                <Component node={node} ref={elementRef} childrenNode={childrenNode}>
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