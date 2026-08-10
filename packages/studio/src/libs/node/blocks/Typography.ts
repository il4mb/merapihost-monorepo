import { Block } from "@/types";
import { TypeIcon } from "lucide-react";
import { HeadingIcon } from "lucide-react";

export const TypographyBlock = {
    label: "Typography",
    category: "Text",
    icon: TypeIcon,
    content: {
        type: "Text",
        tagName: "p",
        props: {
            style: { fontSize: "16px", lineHeight: "1.5" }
        },
        children: [
            {
                type: "textnode",
                content: "This is a paragraph of text. You can edit this text to add your own content."
            }
        ]
    }

} as Block;

export const HeadingBlock = {
    label: "Heading",
    category: "Text",
    icon: HeadingIcon,
    content: {
        type: "Text",
        tagName: "h1",
        props: {
            style: { fontSize: "32px", fontWeight: "bold" }
        },
        children: [
            {
                type: "textnode",
                content: "This is a heading."
            }
        ]
    }
} as Block; 