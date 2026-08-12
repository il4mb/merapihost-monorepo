import { Box } from "@mui/material";
import { Square } from "lucide-react";
import { createType } from "../tools";
import type { JSX } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { nanoid } from "nanoid";

const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
]);

export const ElementNode = createType(({ node, children, ref }) => {

    const { dispatch } = useStudio();
    const tagName = (node.tagName || "div").toLowerCase() as keyof JSX.IntrinsicElements;
    const isVoidTag = VOID_ELEMENTS.has(tagName);
    const content = children || node.props?.content || node.content || null;

    const hasInvalidStructure = typeof node.props?.children === "string" || typeof node.content === "string"; // where should not text
    const isPushTextNode = useRef(false);

    useEffect(() => {
        if (isPushTextNode.current) return;
        if (hasInvalidStructure) {
            isPushTextNode.current = true;
            const textNodeId = nanoid();
            dispatch({
                type: "BULK",
                payload: [
                    {
                        type: "UPDATE_NODE",
                        payload: {
                            id: node.id,
                            type: "Element",
                            content: undefined,
                            props: {
                                ...node.props,
                                children: undefined
                            }
                        }
                    },
                    {
                        // Wrapper Editable Text
                        type: "ADD_NODE",
                        payload: {
                            id: textNodeId,
                            type: "Text",
                            tagName: "span",
                            parent: node.id
                        }
                    },
                    {
                        type: "ADD_NODE",
                        payload: {
                            id: nanoid(),
                            type: "textnode",
                            content: node.content || node.props?.children || "",
                            parent: textNodeId
                        }
                    }
                ]
            });

        }

    }, [hasInvalidStructure, dispatch, node.content, node.id, node.props?.children]);


    if (isVoidTag) {
        return (
            <Box component={tagName} {...node.props} ref={ref} />
        );
    }

    return (
        <Box component={tagName} {...node.props} ref={ref}>
            {content}
        </Box>
    );
}, {
    name: "Element",
    icon: Square,
    draggable: true,

    default: {
        name(ctx) {
            return ctx?.node?.tagName || "Element";
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