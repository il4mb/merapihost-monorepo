import { Typography } from "@mui/material";
import { TypeIcon } from "lucide-react";
import { createType } from "../../tools";
import { JSX } from "react/jsx-runtime";
import { useCallback } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { useInternalNode } from "../../InternalNode";
import RenderEditing from "./RenderEditing";
import { useNodeDescendantsRef } from "@/hooks/useNodes";

export const TextType = createType(({ node, children, ref }) => {
    const { data, setData } = useInternalNode<{ editing: boolean }>();
    const { state, dispatch } = useNodesReducer();
    const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;
    const descendantsRef = useNodeDescendantsRef(node);
   
    const disableChildInteractions = useCallback(() => {
        const descendants = Array.from(descendantsRef.current.values());
        const payloads = descendants.map((n) => ({
            type: "UPDATE_NODE",
            payload: {
                id: n.id,
                selectable: false, // Disable selection of child nodes while editing
                hoverable: false // Disable hover of child nodes while editing
            }
        }));
        dispatch({ type: "BULK", payload: payloads as any[] });
    }, [descendantsRef, dispatch]);

    const enableChildInteractions = useCallback(() => {
        const descendants = Array.from(descendantsRef.current.values());
        const payloads = descendants.map((n) => ({
            type: "UPDATE_NODE",
            payload: {
                id: n.id,
                selectable: true, // Re-enable selection of child nodes after editing
                hoverable: true // Re-enable hover of child nodes after editing
            }
        }));
        dispatch({ type: "BULK", payload: payloads as any[] });
    }, [descendantsRef, dispatch]);

    const handleDoubleClick = useCallback(() => {
        if (data.editing) return;
        const el = ref.current;
        if (data.isSelected && el) {
            disableChildInteractions();
            setData((prev) => ({ ...prev, editing: true, isDraggable: false }));
            requestAnimationFrame(() => el.focus());
        } else {
            setData((prev) => ({ ...prev, editing: false, isDraggable: true }));
        }
    }, [data.isSelected, data.editing, state.collection, node, ref, setData, disableChildInteractions]);

    const stopEditing = useCallback(() => {
        setData((prev) => ({ ...prev, editing: false, isDraggable: true }));
        enableChildInteractions();
    }, [setData, enableChildInteractions]);

    const handleBlur = useCallback(() => {
        if (data.editing) stopEditing();
    }, [data.editing, stopEditing]);

    return (
        <Typography
            component={tagName}
            {...node.props}
            onDoubleClick={handleDoubleClick}
            onBlur={handleBlur}
            contentEditable={data.editing}
            suppressContentEditableWarning={true}
            ref={ref}>
            {data.editing ? (
                <RenderEditing root={node} />
            ) : children}
        </Typography>
    );
}, {
    name: "Text",
    extends: "Element",
    icon: TypeIcon,
    draggable: true,
    accepts: ["TextNode", "FormatNode"],
    data: { editing: false },
    isInstance(target) {
        const supportedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a"];
        return supportedTags.includes(String(target.tagName).toLowerCase());
    },
    default: {
        name: (ctx) => String(ctx?.node?.tagName || "span"),
    },
});