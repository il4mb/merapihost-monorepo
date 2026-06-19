import { useMemo, useRef, useEffect, useState } from "react";
import { useEditor } from "../cores/EditorProvider";
import { NodeObject } from "../type";
import { useTypeRegistry } from "../cores/TypeRegistry";
import { Box } from "@mui/material";

type ElementProps = {
    node: NodeObject;
}
export function Element({ node }: ElementProps) {
    
    const { registries } = useTypeRegistry();
    const { state, dispatch } = useEditor();

    const [dom, setDom] = useState<HTMLElement | null>(null);
    const nodesRef = useRef(state.nodes);

    const childrenIds = useMemo(() => {
        const id = node.id;
        return Array.from(state.nodes.values())
            .filter(n => n.parent === id)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(n => n.id);
    }, [state.nodes]);

    const childrenNode = useMemo(() => {
        return childrenIds.map(id => nodesRef.current.get(id)).filter(Boolean) as NodeObject[];
    }, [childrenIds]); // Only depend on childrenIds, not state.nodes, to avoid unnecessary re-renders

    useEffect(() => {
        nodesRef.current = state.nodes;
    }, [state.nodes]);

    useEffect(() => {
        if (!dom) return;
        dispatch({ type: "SET_DOM", payload: { id: node.id, dom } });
        return () => {
            dispatch({ type: "REMOVE_DOM", payload: node.id });
        }
    }, [dom]);

    const children = childrenNode.map(n => <Element key={n.id} node={n} />);
    const Component = useMemo(() => {
        if (node.type === "Root") {
            return ({ children }: any) => <>{children}</>;
        }
        if (!node.type) {
            if (node.tagName) {
                return (props: any) => <Box component={node.tagName} {...props} ref={setDom} />;
            }
            return null;
        }
        return registries[node.type] || null;
    }, [node.type]);

    const combinedProps = useMemo(() => {
        const nodeProps = node.props || {};

        // Early returns if no Component or model exists
        if (!Component || !('model' in Component)) {
            return { ...nodeProps };
        }

        const modelProps = Component.model?.props || {};

        // 1. Start with all model props as the base
        const result = { ...modelProps };

        // 2. Iterate through nodeProps to merge or override
        for (const [key, nodeValue] of Object.entries(nodeProps)) {
            const modelValue = result[key];

            // 3. If both are standard objects, deeply merge them
            const isModelObj = modelValue && typeof modelValue === "object" && !Array.isArray(modelValue);
            const isNodeObj = nodeValue && typeof nodeValue === "object" && !Array.isArray(nodeValue);

            if (isModelObj && isNodeObj) {
                result[key] = { ...modelValue, ...nodeValue };
            } else {
                // 4. Otherwise, nodeProps always wins (adds missing props or overrides primitives/arrays)
                result[key] = nodeValue;
            }
        }

        return result;
    }, [Component, node.props]);

    if (Component) {
        return (
            <Component {...combinedProps} ref={setDom}>
                {children}
            </Component>
        );
    }

    return (
        <div style={{ border: "1px solid red", padding: "8px", color: "red" }} ref={setDom}>
            Unknown type: {node.type}
        </div>
    );
}