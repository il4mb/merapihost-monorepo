import { Component } from "../../type"
import { useConnector } from "../Connector"
import { ReactNode } from "react"
import { styled } from "@mui/material"

const TextComponent = styled("p")({
    margin: 0,
    padding: 0
})

type TextProps = {
    children: ReactNode;
    fontSize?: number | string;
    style?: React.CSSProperties
}
export const Text: Component<TextProps> = ({ children, fontSize, style }: TextProps) => {
    const { connect } = useConnector() || {}
    return (
        <TextComponent ref={connect} sx={{ fontSize, ...style }}>
            {children}
        </TextComponent>
    )
}

Text.model = {
    name: "Text",
    extends: "Element",
    props: {
        children: "Default text",
        fontSize: 16,
        style: { color: "#000000", backgroundColor: "transparent" }
    },
    related: {},
    rules: { canMove: () => true, canResize: () => true, canDrag: () => true, canDrop: () => true }
}
