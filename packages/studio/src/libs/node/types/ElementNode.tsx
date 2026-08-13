import { Box } from "@mui/material";
import { Square } from "lucide-react";
import { createType } from "../tools";
import type { JSX } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { nanoid } from "nanoid";
import { NodeModel } from "../NodeModel";

const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
]);

export const ElementNode = createType(({ node, children, ref }) => {

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
    draggable: true,
    default: {
        name(ctx) {
            return ctx?.node?.tagName || "Element";
        }
    }
});