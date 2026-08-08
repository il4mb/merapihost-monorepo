import { styled, Typography, Divider, Box, TextField, IconButton } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

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

export default function BlocksManager() {

    const [expanded, setExpanded] = useState(false);

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2, ml: 1 }}>
                <IconButton size="small" sx={{ width: 20, height: 20, padding: 0, minWidth: 0, minHeight: 0 }} onClick={() => setExpanded(!expanded)}>
                    <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronDown size={14} />
                    </motion.div>
                </IconButton>
                <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
                    Blocks
                </Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <AnimatePresence initial={false}>
                {expanded && (
                    <Box
                        component={motion.div}
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        sx={{ py: 1, overflow: "hidden" }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search blocks..."
                            sx={{ mb: 1, px: 1 }}
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
                        <Divider sx={{ mb: 1 }} />
                    </Box>
                )}
            </AnimatePresence>


            <ScrollContainer>

            </ScrollContainer>
        </Box>
    );
}