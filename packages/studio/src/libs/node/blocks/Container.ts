import { Block } from "@/types";
import { BoxIcon, Proportions } from "lucide-react";

export const ContainerBlock = {
    label: "Container",
    category: "Layout",
    icon: Proportions,
    content: {
        type: "Container",
        children: [
            {
                type: "Text",
                tagName: "h1",
                content: "This is a container.",
                props: {
                    style: { fontSize: "32px", fontWeight: "bold" }
                }
            },
            {
                type: "Text",
                tagName: "p",
                props: {
                    style: { fontSize: "16px", lineHeight: "1.5" }
                },
                content: "You can add your own content inside this container."
            }
        ]
    }

} as Block;

export const BoxBlock = {
    label: "Box",
    category: "Layout",
    icon: BoxIcon,
    content: {
        type: "Element",
        tagName: "div",
        props: {},
        children: [
            {
                type: "Text",
                tagName: "p",
                props: {
                    style: { fontSize: "16px", lineHeight: "1.5" }
                },
                content: "This is a box. You can add your own content here."
            }
        ]
    }
} as Block; 