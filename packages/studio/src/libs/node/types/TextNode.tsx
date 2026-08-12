import { Box } from "@mui/material";
import { BinaryIcon, TypeIcon } from "lucide-react";
import { createType } from "../tools";
import { JSX } from "react/jsx-runtime";
import { Children, Fragment, useRef, useEffect, useState, useCallback, useMemo } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { nanoid } from "nanoid";
import { useGlobalKeyListener } from "@/contexts/GlobalKeyListenerProvider";

/***
 * TextNode is a type for raw text content. It is used to represent text nodes in the DOM.
 */
export const TextNode = createType(({ node, children }) => {
    const childrenLength = Children.count(children);
    return (
        <Fragment>
            {childrenLength > 0 ? children : node.props?.children || node.content || null}
        </Fragment>
    );
}, {
    name: "TextNode",
    icon: BinaryIcon,
    draggable: true,
    default: {
        name: "textnode"
    }
});

/***
 * Text is a type for element where the content can be edited. It is used to represent text elements in the DOM.
 * It can be used to represent paragraphs, headings, spans, etc.
 */
export const Text = createType(({ node, children, ref }) => {

    const { state, dispatch } = useStudio();
    const { registerShortcuts } = useGlobalKeyListener();
    const [isSelected, setIsSelected] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const childrenLength = Children.count(children);
    const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;
    const hasInvalidStructure = typeof node.props?.children === "string" || typeof node.content === "string"; // where should not text
    const isPushTextNode = useRef(false);

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
                e.preventDefault();

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
        if (isPushTextNode.current) return;
        if (hasInvalidStructure) {
            isPushTextNode.current = true;
            dispatch({
                type: "BULK",
                payload: [
                    {
                        type: "UPDATE_NODE",
                        payload: {
                            id: node.id,
                            type: "Text",
                            tagName: node.tagName,
                            content: undefined,
                            props: {
                                ...node.props,
                                children: undefined
                            }
                        }
                    },
                    {
                        type: "ADD_NODE",
                        payload: {
                            id: nanoid(),
                            type: "textnode",
                            content: node.content || node.props?.children || "",
                            parent: node.id
                        }
                    }
                ]
            });

        }

    }, [hasInvalidStructure, dispatch, node.content, node.id, node.props?.children]);


    useEffect(() => {
        const nextSelected = state.nodes.selected.has(node.id);
        if (nextSelected !== isSelected) {
            setIsSelected(nextSelected);
        } else {
            setIsEditing(false);
            setIsSelected(nextSelected);
        }
    }, [isSelected, state.nodes.selected, node.id]);

    return (
        <Box
            component={tagName}
            {...node.props}
            onDoubleClick={handleDoubleClick}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            draggable={!isEditing}
            ref={ref}>
            {childrenLength > 0 ? children : node.props?.children || node.content || null}
        </Box>
    );
}, {
    name: "Text",
    icon: TypeIcon,
    draggable: true,
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