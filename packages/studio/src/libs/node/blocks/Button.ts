import { Block } from "@/types";
import { ZapIcon } from "lucide-react";

const ButtonBlock = {
    label: "Button",
    category: "Elements",
    icon: ZapIcon,
    content: {
        type: "Button",
        props: {
            variant: "contained",
            color: "primary",
        },
        children: [
            {
                type: "spanned",
                content: "Click me",
                tagName: "span",
            },
        ],
    },
} as Block;

export const BUTTONS_BLOCKS = [ButtonBlock];
