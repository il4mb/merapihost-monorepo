import { useMemo, useRef, useEffect, useState } from "react";
import { useEditor } from "../cores/EditorProvider";
import { NodeObject } from "../types/node";
import { useTypeRegistry } from "../cores/TypeRegistry";
import { Box } from "@mui/material";
import { createType } from "../tools";
import { Square } from "lucide-react";

type ElementProps = {
    node: NodeObject;
}

export const Element = createType<ElementProps>(({ node }) => {
    const { registries } = useTypeRegistry();
    const { state, dispatch } = useEditor();

    const [dom, setDom] = useState<HTMLElement | null>(null);
    const nodesRef = useRef(state.nodes);

    const childrenNode = useMemo(() => {
        const id = node.id;
        return Array.from(state.nodes.values())
            .filter(n => n.parent === id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [state.nodes]);

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
        if (!node.type) return null;
        return registries[node.type!] || null;
    }, [node.type]);

    const combinedProps = useMemo(() => {
        const nodeProps = node.props || {};
        if (!Component || !('model' in Component)) {
            return { ...nodeProps };
        }

        const modelProps = Component.model.default?.props || {};
        const result = { ...modelProps };
        for (const [key, nodeValue] of Object.entries(nodeProps)) {
            const modelValue = result[key];
            const isModelObj = modelValue && typeof modelValue === "object" && !Array.isArray(modelValue);
            const isNodeObj = nodeValue && typeof nodeValue === "object" && !Array.isArray(nodeValue);

            if (isModelObj && isNodeObj) {
                result[key] = { ...modelValue, ...nodeValue };
            } else {
                result[key] = nodeValue;
            }
        }

        return result;
    }, [Component, node.props]);


    if (node.visible === false) return null;
    // Root node should not render any HTML element, just its children
    if (node.type === "Root") {
        return children;
    } else
        // Render logic if the node type is "Element", use the tagName or default to "div"
        if (node.type === "Element") {
            return (
                <Box component={node.tagName || "div"} {...combinedProps} ref={setDom}>
                    {children}
                </Box>
            );
        } else
            // Render other components based on their type, if they exist in the registry
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
}, {
    name: "Element",
    icon: Square,
    default: {
        name() {
            return this.node.tagName || "Element";
        }
    }
});