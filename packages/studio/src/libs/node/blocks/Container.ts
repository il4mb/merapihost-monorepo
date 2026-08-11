import { Block } from "@/types";
import { BoxIcon, Proportions } from "lucide-react";

export const ContainerBlock = {
    label: "Container",
    category: "Layout",
    icon: Proportions,
    content: {
        type: "Element",
        tagName: "div",
        props: {
            style: {
                maxWidth: "1200px",
                margin: "0 auto",
                padding: "16px"
            }
        },
        children: [
            {
                type: "Text",
                tagName: "h1",
                props: {
                    style: { fontSize: "32px", fontWeight: "bold" }
                },
                children: [
                    {
                        type: "textnode",
                        content: "This is a container."
                    }
                ]
            },
            {
                type: "Text",
                tagName: "p",
                props: {
                    style: { fontSize: "16px", lineHeight: "1.5" }
                },
                children: [
                    {
                        type: "textnode",
                        content: "You can add your own content inside this container."
                    }
                ]
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
        props: {
            style: {
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRadius: "8px"
            }
        },
        children: [
            {
                type: "Text",
                tagName: "p",
                props: {
                    style: { fontSize: "16px", lineHeight: "1.5" }
                },
                children: [
                    {
                        type: "textnode",
                        content: "This is a box. You can add your own content here."
                    }
                ]
            }
        ]
    }
} as Block; 