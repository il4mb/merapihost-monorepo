import { Component } from "../../type";
import { useConnector } from "../../cores/Connector";
import { ReactNode } from "react";
import { Text } from "./Text";
import { Element } from "../../components/Element";
import { Box, Paper } from "@mui/material";
import Button from "./Button";

type CardProps = {
    children?: ReactNode
    title?: string
    style?: React.CSSProperties
}
export const Card: Component<CardProps> = ({ title, children, style }) => {
    const { connect } = useConnector() || {};
    return (
        <Box
            className={"card"}
            ref={connect}
            sx={theme => ({
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "#f9f9f9",
                ...theme.applyStyles("dark", {
                    backgroundColor: "#333",
                    border: "1px solid #555"
                }),
                ...style
            })}>
            <Element
                as={Text}
                slotProps={{
                    node: {
                        name: "Card Title"
                    }
                }}
                style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "8px"
                }}>
                {title || "Card Title"}
            </Element>
            <Element
                as={Box}
                id="card-content"
                slotProps={{
                    node: {
                        name: "Card Content"
                    }
                }}
                sx={{ minHeight: "80px", marginBottom: "16px" }}>
                {children || "Card content goes here..."}
            </Element>
            <Element
                as={Paper}
                id="card-footer"
                sx={{
                    gap: "8px",
                    marginTop: "16px",
                    padding: "8px",
                    display: "flex",
                    justifyContent: "flex-end"
                }}
                slotProps={{
                    node: {
                        name: "Card Footer"
                    }
                }}>
                <Element
                    as={Button}
                    variant="outlined"
                    color="secondary"
                    slotProps={{
                        node: {
                            name: "Card Button"
                        }
                    }}>
                    Cancel
                </Element>
                <Element
                    as={Button}
                    variant="contained"
                    color="primary"
                    slotProps={{
                        node: {
                            name: "Card Button"
                        }
                    }}>
                    Confirm
                </Element>
            </Element>
        </Box>
    )
}

Card.model = {
    name: "Card",
    extends: "Element",
    props: {
        title: "Default Card Title"
    },
    related: {},
    rules: {
        canMove: () => true,
        canResize: () => true,
        canDrag: () => true,
        canDrop: () => true
    }
}
