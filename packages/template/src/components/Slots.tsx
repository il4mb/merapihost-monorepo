import { Box } from "@mui/material";
import { createType } from "../tools";
import { Component } from "lucide-react";

type SlotsProps = {
    children?: React.ReactNode;
}
export const Slots = createType<SlotsProps>(({ children, ref }) => {
    return (
        <Box
            ref={ref}
            sx={{
                border: "1px dashed #ff00f2",
                backgroundColor: "rgba(255, 0, 242, 0.1)",
                padding: "8px",
                minHeight: "32px",
                minWidth: "32px"
            }}>
            {children}
        </Box>
    );
}, {
    name: "Slots",
    icon: Component,
    color: "#ff00f2",
    childrenColor: "#ff00f2",
});