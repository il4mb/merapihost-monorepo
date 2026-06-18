import { styled, Typography, Divider, Box, Tooltip, TextField } from "@mui/material";
import { Info } from "lucide-react";

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
});

export default function FragmentsManager() {
    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
                    Fragments
                </Typography>
                <Box sx={{ mr: 1, display: "flex" }}>
                    <Tooltip
                        arrow
                        placement="left"
                        title={
                            <Box sx={{ p: 0.5, maxWidth: 220 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Build once, use everywhere.
                                </Typography>
                                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                                    Fragments are your reusable design blocks. Right-click any element and select <b>Create Fragment</b> to save it here.
                                </Typography>
                            </Box>
                        }>
                        <Box sx={{
                            cursor: "help",
                            color: "text.secondary",
                            display: "flex",
                            transition: "color 0.2s",
                            "&:hover": { color: "primary.main" }
                        }}>
                            <Info size={16} />
                        </Box>
                    </Tooltip>
                </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ px: 1, mb: 1 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search fragments..."
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
                {/* Fragment items will go here */}
            </ScrollContainer>
        </Box>
    );
}