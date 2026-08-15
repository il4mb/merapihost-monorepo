import { IconButton, Tooltip, Typography } from "@mui/material";
import { BoldIcon, ItalicIcon, TypeIcon, UnderlineIcon } from "lucide-react";
import { createType } from "../../tools";
import { JSX } from "react/jsx-runtime";
import { useCallback, useEffect } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import RenderEditing from "./RenderEditing";
import { useNodeDescendantsRef } from "@/hooks/useNodes";

export const TextType = createType(({ node, children, ref }) => {
    const { dispatch } = useNodesReducer();
    const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;
    const descendantsRef = useNodeDescendantsRef(node);

    const clearWindowSelection = useCallback(() => {
        // clear both selection
        const win = node.dom.ownerDocument.defaultView;
        window?.getSelection()?.removeAllRanges();
        win?.getSelection()?.removeAllRanges();
    }, [node.dom]);

    const prepareStartEditing = useCallback(() => {
        const descendants = Array.from(descendantsRef.current.values());
        const payloads = descendants.map((n) => ({
            type: "UPDATE_NODE",
            payload: { id: n.id, selectable: false, hoverable: false }
        })) as any[];
        dispatch({
            type: "BULK",
            payload: [
                {
                    type: "UPDATE_NODE",
                    payload: {
                        id: node.id,
                        data: {
                            editing: true
                        }
                    }
                },
                ...payloads
            ]
        });
        clearWindowSelection();
    }, [descendantsRef, dispatch, node.id, clearWindowSelection]);

    const prepareStopEditing = useCallback(() => {
        const descendants = Array.from(descendantsRef.current.values());
        const payloads = descendants.map((n) => ({
            type: "UPDATE_NODE",
            payload: { id: n.id, selectable: true, hoverable: true }
        })) as any[];
        dispatch({
            type: "BULK",
            payload: [
                {
                    type: "UPDATE_NODE",
                    payload: {
                        id: node.id,
                        data: {
                            editing: false
                        }
                    }
                },
                ...payloads
            ]
        });
        clearWindowSelection();
    }, [descendantsRef, dispatch, node.id, clearWindowSelection]);

    const handleDoubleClick = useCallback(() => {
        if (node.data.editing) return;
        if (node.data.isSelected && ref.current) {
            prepareStartEditing();
        }
    }, [node.data.isSelected, node.data.editing, ref, prepareStartEditing]);

    useEffect(() => {
        // blur detection
        if (!node.data.editing) return;
        return prepareStopEditing;
    }, [node.data.editing, node.data.isSelected, prepareStopEditing]);

    return (
        <Typography
            component={tagName}
            {...node.props}
            onDoubleClick={handleDoubleClick}
            sx={{
                ...node.props.sx,
                userSelect: "none",
                ...(node.data.editing ? {
                    position: "relative",
                    userSelect: "none",
                    cursor: "text"
                } : {})
            }}
            ref={ref}>
            {node.data.editing ? (
                <RenderEditing root={node} />
            ) : children}
        </Typography>
    );
}, {
    name: "Text",
    extends: "Element",
    icon: TypeIcon,
    draggable: true,
    accepts: ["textnode", "formatted"],
    data: { editing: false },
    isInstance(target) {
        const supportedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a"];
        return supportedTags.includes(String(target.tagName).toLowerCase());
    },
    default: {
        name: (ctx) => String(ctx?.node?.tagName || "span"),
    },
    actions: {
        bold: () => {
            return (
                <Tooltip title={"Toggle Bold"}>
                    <IconButton>
                        <BoldIcon size={16} />
                    </IconButton>
                </Tooltip>
            );
        },
        italic: () => {
            return (
                <Tooltip title={"Toggle Italic"}>
                    <IconButton>
                        <ItalicIcon size={16} />
                    </IconButton>
                </Tooltip>
            );
        },
        underline: () => {
            return (
                <Tooltip title={"Toggle Underline"}>
                    <IconButton>
                        <UnderlineIcon size={16} />
                    </IconButton>
                </Tooltip>
            );
        }
    }
});