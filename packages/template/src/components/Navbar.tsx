import { Box, SxProps } from "@mui/material";
import { createType } from "../tools";

type NavbarProps = {
    children?: React.ReactNode;
    sx?: SxProps;
}
export const Navbar = createType<NavbarProps>(({ children, ref, sx }) => {
    return (
        <Box ref={ref} component={"nav"} sx={sx}>
            {children}
        </Box>
    );
}, {
    name: "Navbar",
    props: {
        sx: {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: "50px",
            backgroundColor: "#ecf4ff",
            padding: "10px 20px",
            borderRadius: "0px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "background-color 0.3s ease",
            "&:hover": {
                backgroundColor: "#4b86e6"
            }
        }
    }
});