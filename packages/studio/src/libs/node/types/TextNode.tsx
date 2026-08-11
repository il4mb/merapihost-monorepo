import { Box } from "@mui/material";
import { BinaryIcon, TypeIcon } from "lucide-react";
import { NodeObject, TypeContext } from "@/types";
import { createType } from "../tools";
import { JSX } from "react/jsx-runtime";
import { Children, Fragment, useRef, useState, useEffect } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { nanoid } from "nanoid";

/***
 * TextNode is a type for raw text content. It is used to represent text nodes in the DOM.
 */
export const TextNode = createType(({ node, children, ref }) => {
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

    const { dispatch } = useStudio();
    const childrenLength = Children.count(children);
    const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;
    const hasInvalidStructure = typeof node.props?.children === "string" || typeof node.content === "string"; // where should not text
    const isPushTextNode = useRef(false);

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

    return (
        <Box
            component={tagName}
            {...node.props}
            contentEditable={true}
            suppressContentEditableWarning={true}
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
        name: () => {
            console.log(this);
            // @ts-ignore
            return String(this?.node?.tagName || "span");
        }
    }
});