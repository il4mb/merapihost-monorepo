import { Block } from "@/types";
import { Grid2X2Icon, LayoutPanelLeft } from "lucide-react";

export const GridBlock = {
    label: "Grid",
    category: "Layout",
    icon: Grid2X2Icon,
    content: {
        type: "Grid",
        props: {},
        children: [
            {
                type: "GridItem",
                props: {},
                children: [
                    {
                        type: "Text",
                        tagName: "p",
                        props: {
                            style: { fontSize: "16px", lineHeight: "1.5" }
                        },
                        content: "This is a paragraph of text. You can edit this text to add your own content."
                    }
                ]
            },
            {
                type: "GridItem",
                props: {},
                children: [
                    {
                        type: "Text",
                        tagName: "p",
                        props: {
                            style: { fontSize: "16px", lineHeight: "1.5" }
                        },
                        content: "This is another paragraph of text. You can edit this text to add your own content."
                    }
                ]
            }
        ]
    }
} as Block;

export const GridItemBlock = {
    label: "Grid Item",
    category: "Layout",
    icon: LayoutPanelLeft,
    content: {
        type: "GridItem",
        children: [
            {
                tagName: "h4",
                type: "Text",
                props: {
                    style: { fontSize: "16px", lineHeight: "1.5" }
                },
                content: "Grid Item"
            },
            {
                tagName: "p",
                type: "Text",
                props: {
                    style: { fontSize: "14px", lineHeight: "1.5" }
                },
                content: "This is a grid item. You can add content here."
            },
            {
                tagName: "p",
                type: "Text",
                props: {
                    style: { fontSize: "14px", lineHeight: "1.5" }
                },
                content: "You can also add more elements inside this grid item."
            }
        ]
    }
} as Block; 