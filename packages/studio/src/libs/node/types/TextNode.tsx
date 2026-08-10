import { Box, Typography } from "@mui/material";
import { CaseSensitive, TypeIcon } from "lucide-react";
import { NodeObject } from "@/types";
import { createType } from "../tools";
import { JSX } from "react/jsx-runtime";
import { Children } from "react";

type TextProps = {
    node: NodeObject;
    children?: React.ReactNode;
}

export const TextNode = createType<TextProps>(({ node, children, ref }) => {

    const childrenLength = Children.count(children);

    const tagName = node.tagName as keyof JSX.IntrinsicElements;
    if (tagName) {
        return (
            <Typography component={tagName} {...node.props} ref={ref}>
                {childrenLength > 0 ? children : node.props?.children || node.content || null}
            </Typography>
        );
    }
    return node.content;
}, {
    name: "Text",
    icon: TypeIcon,
    isInstance(target) {
        if (("content" in target && typeof target.content === "string") || (target.props?.children && typeof target.props.children === "string")) {
            return true;
        }
        return false;
    },
    draggable: true,
    default: {
        name() {
            return this.node.tagName || "Element";
        },
        events: [
            "onClick",
            "onMouseEnter",
            "onMouseLeave",
            "onMouseOver",
            "onMouseOut",
            "onMouseMove",
            "onMouseDown",
            "onMouseUp",
            "onKeyDown",
            "onKeyUp",
            "onKeyPress",
        ]
    }
});