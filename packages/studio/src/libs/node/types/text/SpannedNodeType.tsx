import { BoldIcon, ItalicIcon, TypeIcon, UnderlineIcon, LinkIcon, CodeIcon } from "lucide-react";
import { createElement, JSX, useCallback } from "react";
import { createType } from "@/libs/node/createType";
import { useNodeInternal } from "@/libs/node";

export const FORMAT_NODE_TAGS = [
    "a",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "small",
    "mark",
    "del",
    "ins",
    "sub",
    "sup",
    "span",
];

/**
 * FormatNode adalah wrapper struktural untuk formatting (bold/italic/underline/dst).
 * Bisa nested ke FormatNode lain (mis. strong > em) atau membungkus TextNode leaf.
 * Tidak punya `content` sendiri — murni pemegang tag + children.
 */
export const SpannedNodeType = createType(
    ({ node, ref, children }) => {
        const { invokeCommand } = useNodeInternal();
        const TagName = (node.tagName || "strong").toLowerCase() as keyof JSX.IntrinsicElements;
        const FinalTagName = FORMAT_NODE_TAGS.includes(TagName) ? TagName : "span";
        const { sx, ...rest } = node.props;

        const onDoubleClick = useCallback(
            (e: MouseEvent) => {
                e.stopPropagation();
                invokeCommand("startEditing");
            },
            [invokeCommand],
        );

        return createElement(FinalTagName, { ...rest, ref, onDoubleClick }, node.content ? node.content : children);
    },
    {
        name: "Spanned",
        extends: "Text",
        icon: ({ size, color, node }) => {
            const tagName = String(node?.tagName || "strong").toLowerCase();
            switch (tagName) {
                case "strong":
                    return <BoldIcon size={size} color={color} />;
                case "em":
                    return <ItalicIcon size={size} color={color} />;
                case "u":
                    return <UnderlineIcon size={size} color={color} />;
                case "a":
                    return <LinkIcon size={size} color={color} />;
                default:
                    return <CodeIcon size={size} color={color} />;
            }
        },
        accepts: [], // structural, tidak menerima child baru
        isInstance(target) {
            return String(target.type || "").toLowerCase() === "spanned";
        },
        default: {
            name: (n) => {
                return (
                    {
                        strong: "Bold",
                        em: "Italic",
                        u: "Underline",
                        a: "Link",
                    }[String(n?.node?.tagName || "strong").toLowerCase()] || "span"
                );
            },
            props: {
                sx: {
                    userSelect: "none",
                    whiteSpace: "break-spaces",
                },
            },
        },
    },
);
