import { styled, Typography, Divider, Box, TextField } from "@mui/material";

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

export default function AssetsManager() {

    return (
        <Box>
            <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
                Assets
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ px: 1, mb: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search assets..."
                    sx={{ mb: 1 }}
                    slotProps={{
                        input: {
                            sx: {
                                padding: "0px 8px",
                                fontSize: "0.875rem",
                                height: "1.5rem",
                            }
                        }
                    }}
                />
            </Box>
            <Divider sx={{ mb: 1 }} />
            <ScrollContainer>

            </ScrollContainer>
        </Box>
    );
}