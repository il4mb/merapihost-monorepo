import { styled, Typography, Divider, Box } from "@mui/material";

const ScrollContainer = styled("div")({
    width: "100%",
    height: "100%",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
        width: "6px"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: "3px"
    },
    "&::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "rgba(0,0,0,0.3)"
    }
})

export default function PagesManager() {

    return (
        <Box>
            <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
                Pages
            </Typography>
            <Divider sx={{ mb: 1 }} />

            <ScrollContainer>

            </ScrollContainer>
        </Box>
    );
}