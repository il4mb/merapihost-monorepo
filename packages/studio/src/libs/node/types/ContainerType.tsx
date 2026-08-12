import { Container } from "@mui/material";
import { Proportions } from "lucide-react";
import { createType } from "../tools";
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
    color: "#618deb",
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