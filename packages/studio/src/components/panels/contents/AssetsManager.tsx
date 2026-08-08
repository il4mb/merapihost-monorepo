"use client";
import { Typography, Divider, Box, LinearProgress, Stack } from "@mui/material";
import AssetContents from "./AssetContents";
import { LucideFolderOutput } from "lucide-react";
import DragAndDropZone from "@editor/components/DragAndDropZone";
import { AnimatePresence, motion } from "motion/react";
import ScrollContainer from "@/components/ui/ScrollContainer";
import { useAssets } from "@/contexts/AssetsProvider";

export default function AssetsManager() {
    const { loading, error, parent, path, handleGoBack } = useAssets();
    return (
        <Stack
            component={motion.div}
            layout
            direction="column"
            sx={{
                overflow: "hidden",
                flex: 1
            }}>
            <Box sx={{ position: 'relative' }}>
                <Typography
                    variant="overline"
                    sx={{
                        px: 1,
                        display: "block",
                        fontWeight: 600
                    }}>
                    Assets
                </Typography>
                <Divider />
                <LinearProgress
                    sx={{
                        height: 2,
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        opacity: loading ? 1 : 0,
                        transition: "opacity 0.3s ease",
                    }}
                />
            </Box>
            <AnimatePresence initial={false} mode="wait">
                {parent && (
                    <Box
                        key={parent.id}
                        component={motion.div}
                        layoutId={`asset-${parent.id}`}>
                        <Box
                            onDoubleClick={handleGoBack}
                            sx={{
                                fontSize: 10,
                                display: "flex",
                                alignItems: "center",
                                p: 1, gap: .5, mb: .25,
                                cursor: "pointer",
                                userSelect: "none",
                                overflow: "hidden",
                                "&:hover": {
                                    backgroundColor: "action.hover"
                                }
                            }}>
                            <LucideFolderOutput
                                size={16}
                                style={{
                                    marginRight: 4,
                                    minWidth: 16,
                                    minHeight: 16,
                                    color: "text.secondary"
                                }} />
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: 10,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    direction: "rtl",
                                    textAlign: "left"
                                }}>
                                {path}
                            </Typography>
                        </Box>
                        <Divider />
                    </Box>
                )}
            </AnimatePresence>
            <DragAndDropZone>
                <ScrollContainer
                    sx={{ pt: 1 }}>
                    {error && (
                        <Typography
                            variant="body2"
                            color="error"
                            sx={{
                                fontSize: 12,
                                mb: 1,
                                bgcolor: "rgba(255, 0, 0, 0.1)",
                                borderRadius: .5, p: 1, mx: 1
                            }}>
                            {error}
                        </Typography>
                    )}
                    <AssetContents
                        loading={loading} />
                </ScrollContainer>
            </DragAndDropZone>
        </Stack>
    );
}