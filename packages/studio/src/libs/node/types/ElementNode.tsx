import { Box } from "@mui/material";
import { Square } from "lucide-react";
import { createType } from "../tools";
import type { JSX } from "react/jsx-runtime";

const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
]);

export const ElementNode = createType(({ node, children, ref }) => {

    const tagName = (node.tagName || "div").toLowerCase() as keyof JSX.IntrinsicElements;
    const isVoidTag = VOID_ELEMENTS.has(tagName);
    const content = children || node.props?.content || node.content || null;

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