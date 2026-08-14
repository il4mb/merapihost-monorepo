import { BoldIcon } from "lucide-react";
import { createType } from "../../tools";
import { createElement, JSX } from "react";

export const FORMAT_NODE_TAGS = ["strong", "em", "b", "i", "u", "small", "mark", "del", "ins", "sub", "sup"];

/**
 * FormatNode adalah wrapper struktural untuk formatting (bold/italic/underline/dst).
 * Bisa nested ke FormatNode lain (mis. strong > em) atau membungkus TextNode leaf.
 * Tidak punya `content` sendiri — murni pemegang tag + children.
 */
export const FormatNodeType = createType(({ node, children, ref }) => {
    const TagName = (node.tagName || "strong").toLowerCase() as keyof JSX.IntrinsicElements;
    const FinalTagName = FORMAT_NODE_TAGS.includes(TagName) ? TagName : "strong";

    return createElement(FinalTagName, { ref, ...node.props }, children);
}, {
    name: "Formatted",
    icon: BoldIcon,
    draggable: false, // structural, ikut parent-nya, tidak didrag manual
    droppable: [],
    accepts: ["textnode", "formatted"], // bisa nested
    isInstance(target) {
        return String(target.type || "").toLowerCase() === "formatnode";
    },
    default: {
        name: "formatted",
    }
});