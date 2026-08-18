import { Block } from "@/types";
import { CodeIcon, TypeIcon } from "lucide-react";
import { HeadingIcon } from "lucide-react";

const TypographyBlock = {
    label: "Typography",
    category: "Text",
    icon: TypeIcon,
    content: {
        type: "Text",
        tagName: "p",
        content: "This is a paragraph of text. You can edit this text to add your own content.",
        props: {
            style: { fontSize: "16px", lineHeight: "1.5" },
        },
    },
} as Block;

const SpanBlock = {
    label: "Span",
    category: "Text",
    icon: CodeIcon,
    content: {
        type: "spanned",
        tagName: "span",
        content: "This is a span of text.",
        props: {
            style: { fontSize: "16px" },
        },
    },
} as Block;

const HeadingBlock = {
    label: "Heading",
    category: "Text",
    icon: HeadingIcon,
    content: {
        type: "Text",
        tagName: "h1",
        content: "This is a heading.",
        props: {
            style: { fontSize: "32px", fontWeight: "bold" },
        },
    },
} as Block;

export const TEXT_BLOCKS = [TypographyBlock, SpanBlock, HeadingBlock] as Block[];
