import { Button } from "@mui/material";
import { ZapIcon } from "lucide-react";
import { createType } from "@/libs/node/createType";
import type { JSX } from "react/jsx-runtime";

export const ButtonType = createType(
    ({ node, children, ref }) => {
        const tagName = (node.tagName || "button").toLowerCase() as keyof JSX.IntrinsicElements;
        return (
            <Button component={tagName} {...node.props} ref={ref}>
                {children}
            </Button>
        );
    },
    {
        name: "Button",
        extends: "text",
        icon: ZapIcon,
        isInstance: (node) => node.type === "Button",
        default: {
            name(ctx) {
                return ctx?.node?.tagName || "Button";
            },
            tagName: "button",
            content: "Button",
            props: {},
        },
    },
);
