import { styled } from "@mui/material";

const TextField = styled("input")(({ theme }) => ({
    width: "100%",
    height: "100%",
    padding: "4px 8px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 14,
    boxSizing: "border-box",
    "&:focus": {
        outline: "none",
        borderColor: theme.palette.primary.main,

    }
}));

export default TextField;