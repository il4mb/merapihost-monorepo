import { Container } from "@mui/material";
import { Proportions } from "lucide-react";
import { createType } from "../createType";
import type { JSX } from "react/jsx-runtime";

export const ContainerType = createType(({ node, children, ref }) => {
    const tagName = (node.tagName || "div").toLowerCase() as keyof JSX.IntrinsicElements;
    return (
        <Container component={tagName} {...node.props} maxWidth={node.props.maxWidth} ref={ref}>
            {children}
        </Container>
    );
}, {
    name: "Container",
    extends: "Element",
    icon: Proportions,
    draggable: true,
    color: {
        light: "#0a58b1",
        dark: "#b7ceff"
    },
    default: {
        name(ctx) {
            return ctx?.node?.tagName || "Container";
        },
        tagName: "div",
        props: {
            maxWidth: "lg"
        }
    }
});