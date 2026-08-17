import { Typography } from "@mui/material";
import { BoldIcon, ItalicIcon, TypeIcon, UnderlineIcon, RemoveFormatting } from "lucide-react";
import { JSX } from "react/jsx-runtime";
import { useCallback, useEffect, useRef } from "react";
import { useNodes } from "@/contexts";
import RenderEditing from "./RenderEditing";
import { useNodeDescendantsRef } from "@/hooks/useNodes";
import { NodeModel, createType, useNodeInternal } from "@/libs/node";

type TextTypeData = {
    editing: boolean;
    formats: string[]
}
export const TextType = createType<TextTypeData>(({ node, children, ref }) => {

    const { invokeCommand } = useNodeInternal();
    const { state, dispatch } = useNodes();;
    const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;
    const descendantsRef = useNodeDescendantsRef(node);
    const textRootRef = useRef<NodeModel>(null);

    const getRootTextNode = useCallback(() => {
        // If the starting node isn't text
        if (!node.type.isText) return node;

        // Start tracking from the current node
        let rootTextNode = node;
        let parentNode = state.collection.get(node.parent || "");

        // Keep walking UP the tree as long as the parent exists and IS a text node
        while (parentNode && parentNode.type.isText) {
            rootTextNode = parentNode as any; // Move our pointer up one level

            // Fetch the next parent in the chain to check in the next loop iteration
            parentNode = state.collection.get(rootTextNode.parent || "");
        }

        // Once the while loop stops (because parentNode is a Div/Canvas/undefined), 
        // rootTextNode holds the absolute highest-level text node.
        return rootTextNode;
    }, [state.collection, node]);

    useEffect(() => {
        textRootRef.current = getRootTextNode();
    }, [getRootTextNode]);

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
                    payload: { id: node.id, data: { editing: true } }
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
                    payload: { id: node.id, data: { editing: false }, selectable: true, hoverable: true }
                },
                ...payloads
            ]
        });
        clearWindowSelection();
    }, [descendantsRef, dispatch, node.id, clearWindowSelection]);

    const handleDoubleClick = useCallback(() => {
        invokeCommand("toggleEditing");
        // const textRoot = textRootRef.current;
        // const isRootNode = textRoot?.id === node.id;
        // if (textRoot) {
        //     if (!isRootNode) {
        //         // pass event to text root
        //         dispatch({ type: "SET_SELECTED", payload: textRoot.id });
        //         setTimeout(() => {
        //             textRoot.dom?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        //         }, 50);
        //         return;
        //     }

        //     // only pass when not editing and in root text node
        //     if (node.data.editing) return;
        //     if (node.data.isSelected && ref.current) {
        //         prepareStartEditing();
        //     }
        // }
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
                "&:empty:before": {
                    content: "\"Empty\"",
                    fontStyle: "italic",
                    color: "#ccc"
                },
                ...(node.data.editing ? {
                    position: "relative",
                    userSelect: "none",
                    cursor: "text",
                    minHeight: '1.2em'
                } : {})
            }}
            ref={ref}>
            {node.data.editing ? (<RenderEditing root={node} />) : (node.content ? node.content : children)}
        </Typography>
    );
}, {
    name: "Text",
    extends: "Element",
    icon: TypeIcon,
    draggable: true,
    accepts: ["formatted"],
    data: { editing: false, formats: [] },
    isInstance(target) {
        const supportedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a"];
        return supportedTags.includes(String(target.tagName).toLowerCase()) || typeof target.content === "string";
    },
    default: {
        name: (ctx) => String(ctx?.node?.tagName || "span"),
        props: {
            sx: {
                userSelect: "none",
                whiteSpace: "break-spaces",
            }
        }
    },
    actions: (node) => {
        if (!node.data.editing) {
            return !node.isTextLeaf && {
                clean: {
                    icon: RemoveFormatting,
                    title: "clear text"
                }
            }
        }
        return {
            bold: {
                icon: BoldIcon,
                active: node.data.formats.includes("strong")
            },
            italic: {
                icon: ItalicIcon,
                active: node.data.formats.includes("em")
            },
            underline: {
                icon: UnderlineIcon,
                active: node.data.formats.includes("u")
            },
            delete: false,
            parent: false
        }
    },
    commands: {
        bold: (node) => {
            console.log("Bold Command", node.data);
        },
        italic: () => {
            console.log("Italic Command");
        },

        toggleEditing: (node, { context }) => {
            console.log("Starting Editing", context.getChildren());
        }
    }
});