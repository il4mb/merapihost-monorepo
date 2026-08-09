import { useMemo, useRef, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Square } from "lucide-react";
import { NodeObject } from "@/types";
import { useStudio } from "@/contexts/StudioProvider";
import { createType } from "../tools";
import { REGISTRY } from "..";

type ElementProps = {
    node: NodeObject;
}

export const ElementNode = createType<ElementProps>(({ node }) => {

    const { state, dispatch } = useStudio();
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
    }, [dom, node.id, dispatch]);

    const children = childrenNode.map(n => <ElementNode key={n.id} node={n} />);
    
    const Component = useMemo(() => {
        if (!node.type) return null;
        return REGISTRY[node.type] || null;
    }, [node.type]);

    const combinedProps = useMemo(() => {
        const nodeProps = node.props || {};
        if (!Component || !('model' in Component)) {
            return { ...nodeProps };
        }

        const modelProps = (Component.model.default?.props || {}) as Record<string, any>;
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

    // 1. Root node should not render any HTML element, just its children
    if (node.type === "Root") {
        return children;
    }

    // 2. Render components based on their type if they exist in the registry
    if (Component) {
        return (
            // @ts-ignore
            <Component {...combinedProps} ref={setDom}>
                {children}
            </Component>
        );
    }

    // 3. If type is explicitly "Element" OR if the type doesn't exist but a tagName is provided
    if (node.type === "Element" || node.tagName) {
        return (
            // @ts-ignore
            <Box component={node.tagName || "div"} {...combinedProps} ref={setDom}>
                {children.length ? children : node.content || null}
            </Box>
        );
    }

    // 4. Fallback: Type is unknown, not in registry, and no tagName is provided
    return (
        <div style={{ border: "1px solid red", padding: "8px", color: "red" }} ref={setDom}>
            Unknown type: {node.type || "undefined"} (id: {node.id})
        </div>
    );
}, {
    name: "Element",
    icon: Square,
    default: {
        name() {
            return this.node.tagName || "Element";
        },
        events: [
            "onClick",
            "onMouseEnter",
            "onMouseLeave",
            "onMouseOver",
            "onMouseOut",
            "onMouseMove",
            "onMouseDown",
            "onMouseUp",
            "onKeyDown",
            "onKeyUp",
            "onKeyPress",
        ]
    }
});