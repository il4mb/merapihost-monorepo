import { Box } from "@mui/material";
import { Square } from "lucide-react";
import { createType } from "../tools";
import type { JSX } from "react/jsx-runtime";

const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
]);

export const ElementType = createType(({ node, children, ref }) => {

    const tagName = (node.tagName || "div").toLowerCase() as keyof JSX.IntrinsicElements;
    const isVoidTag = VOID_ELEMENTS.has(tagName);

    if (isVoidTag) {
        return (
            <Box component={tagName} {...node.props} ref={ref} />
        );
    }

    return (
        <Box component={tagName} {...node.props} ref={ref}>
            {children}
        </Box>
    );
}, {
    name: "Element",
    icon: Square,
    data: {
        element: true
    },
    draggable: true,
    default: {
        name(ctx) {
            return ctx?.node?.tagName || "Element";
        }
    }
});