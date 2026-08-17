import { BoldIcon } from "lucide-react";
import { createElement, JSX, useCallback } from "react";
import { useNodeInternal, createType } from "@/libs/node";

export const FORMAT_NODE_TAGS = ["strong", "em", "b", "i", "u", "small", "mark", "del", "ins", "sub", "sup", "span"];

/**
 * FormatNode adalah wrapper struktural untuk formatting (bold/italic/underline/dst).
 * Bisa nested ke FormatNode lain (mis. strong > em) atau membungkus TextNode leaf.
 * Tidak punya `content` sendiri — murni pemegang tag + children.
 */
export const SpannedNodeType = createType(({ node, ref, children }) => {
    const { invokeCommand } = useNodeInternal();
    const TagName = (node.tagName || "strong").toLowerCase() as keyof JSX.IntrinsicElements;
    const FinalTagName = FORMAT_NODE_TAGS.includes(TagName) ? TagName : "span";
    const { sx, ...rest } = node.props;

    const onDoubleClick = useCallback((e: MouseEvent) => {
        e.stopPropagation();
        invokeCommand("startEditing");
    }, [invokeCommand]);

    return createElement(FinalTagName, { ...rest, ref, onDoubleClick }, node.content ? node.content : children);
}, {
    name: "Spanned",
    extends: "Text",
    icon: BoldIcon,
    draggable: true, // structural, ikut parent-nya, tidak didrag manual
    droppable: [],
    accepts: ["textnode", "spanned"], // bisa nested
    isInstance(target) {
        return String(target.type || "").toLowerCase() === "spanned";
    },
    default: {
        name: (n) => n.node.tagName && n.node.tagName !== "span" ? n.node.tagName : "spanned",
    }
});