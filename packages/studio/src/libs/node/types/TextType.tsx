import { Typography } from "@mui/material";
import { TypeIcon } from "lucide-react";
import { createType } from "../tools";
import { JSX } from "react/jsx-runtime";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { useGlobalKeyListener } from "@/contexts/GlobalKeyListenerProvider";
import { useInternalNode } from "../InternalNode";

/***
 * Text is a type for element where the content can be edited. It is used to represent text elements in the DOM.
 * It can be used to represent paragraphs, headings, spans, etc.
 */
export const TextType = createType(({ node, children, ref }) => {

    const { data, setData } = useInternalNode<{ editing: boolean }>();
    const { state } = useNodesReducer();
    const { registerShortcuts } = useGlobalKeyListener();
    const [isSelected, setIsSelected] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;

    const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isSelected) {
            setIsEditing(true);
        }
    }, [isSelected]);

    const shortcutHandlers = useMemo(() => [
        {
            keys: ["*"],
            preventDefault: true,
            action: (e: KeyboardEvent, keys: string[]) => {
                // e.preventDefault();

                console.log("Shortcut triggered:", keys);
            }
        }
    ], []);

    useEffect(() => {
        if (!isEditing) return;
        // Sticky shortcuts for text editing to prevent them from being overridden by other components
        const unregister = registerShortcuts(shortcutHandlers, true);
        return () => {
            unregister();
        };
    }, [shortcutHandlers, isEditing]);

    useEffect(() => {
        const nextSelected = state.selected.has(node.id);
        if (nextSelected !== isSelected) {
            setIsSelected(nextSelected);
        } else {
            setIsEditing(false);
            setIsSelected(nextSelected);
        }
    }, [isSelected, state.selected, node.id]);

    useEffect(() => {
        console.log("TextType data changed:", data);
    }, [data]);

    return (
        <Typography
            component={tagName}
            {...node.props}
            onDoubleClick={handleDoubleClick}
            ref={ref}>
            {children}
        </Typography>
    );
}, {
    name: "Text",
    extends: "Element",
    icon: TypeIcon,
    draggable: true,
    accepts: ["TextNode"], // Text can accept TextNode as children
    data: {
        editing: false
    },
    isInstance(target) {
        const supportedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a"];
        return supportedTags.includes(String(target.tagName).toLowerCase());
    },

    default: {
        name: (ctx) => {
            return String(ctx?.node?.tagName || "span");
        }
    }
});