import { Component } from "../../type";
import { useConnector } from "../../cores/Connector";
import { Box, Theme } from "@mui/material";
import { Element } from "../../base/Element";
import { BackgroundColor } from "../../base/mods/BackgroundColor";

const applyStyle = (theme: Theme, style?: React.CSSProperties) => ({
    width: "100%",
    height: "60px",
    backgroundColor: "#dfedfd",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    borderRadius: "8px",
    ...theme.applyStyles("dark", {
        backgroundColor: "#091725"
    }),
    ...style
})

interface NavbarProps {
    style?: React.CSSProperties;
}

export const Navbar: Component<NavbarProps> = ({ style }) => {
    const { connect } = useConnector();
    return (
        <Box component="nav" ref={connect} sx={applyStyle} style={style}>
            <Element as={"h2"}>Navbar</Element>
            <Element as={Box} id="menu-container" slotProps={{ node: { name: "Menu Container" } }} sx={{ display: "flex", gap: "16px", marginLeft: "auto" }}>
                <Element as={"a"} href="#" slotProps={{ node: { name: "Home Link" } }}>
                    Home
                </Element>
                <Element as={"a"} href="#" slotProps={{ node: { name: "About Link" } }}>
                    About
                </Element>
                <Element as={"a"} href="#" slotProps={{ node: { name: "Contact Link" } }}>
                    Contact
                </Element>
            </Element>
        </Box>
    )
}

Navbar.model = {
    name: "Navbar",
    extends: "Element",
    props: {
        style: { backgroundColor: "#cfe6f5" },
    },
    related: {
        BackgroundColor
    },
    rules: {
        canMove: () => true,
        canResize: () => true,
        canDrag: () => true,
        canDrop: () => true
    }
}
