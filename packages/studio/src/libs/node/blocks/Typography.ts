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
        content: "This is a paragraph of text. You can edit this text to add your own content.",
        props: {
            style: { fontSize: "16px", lineHeight: "1.5" }
        }
    }

} as Block;

export const HeadingBlock = {
    label: "Heading",
    category: "Text",
    icon: HeadingIcon,
    content: {
        type: "Text",
        tagName: "h1",
        content: "This is a heading.",
        props: {
            style: { fontSize: "32px", fontWeight: "bold" }
        }
    }
} as Block; 