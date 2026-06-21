import { Button as MuiButton } from "@mui/material"
import { Component } from "../../type"

interface ButtonProps {
    children?: React.ReactNode
    variant?: "text" | "outlined" | "contained"
    color?: "primary" | "secondary" | "inherit" | "success" | "error" | "info" | "warning"
    style?: React.CSSProperties 
}

const Button: Component<ButtonProps> = ({ children, variant, color, ref, style }) => {

    return (
        <MuiButton variant={variant} color={color} ref={ref} style={style}>
            {children || "Button"}
        </MuiButton>
    )
}

Button.model = {
    name: "Button",
    extends: "Element",
    props: {
        style: {
        }
    },
    related: {},
    rules: {
        canMove: () => true,
        canResize: () => true,
        canDrag: () => true,
        canDrop: () => true
    }
}

export default Button
