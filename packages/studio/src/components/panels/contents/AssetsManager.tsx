import { Typography, Divider, Box, LinearProgress, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssetContents from "./AssetContents";
import { LucideFolderOutput } from "lucide-react";
import DragAndDropZone from "@editor/components/DragAndDropZone";
import { AnimatePresence, motion } from "motion/react";
import { useStudio } from "@/contexts/StudioProvider";
import ScrollContainer from "@/components/ui/ScrollContainer";

const MAX_PATH_LENGTH = 28; // Maximum length for the displayed path
export default function AssetsManager() {

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { state, dispatch } = useStudio();

    const delayUXLoading = useRef<NodeJS.Timeout | null>(null);
    const openedFolder = useMemo(() => {
        if (state.assets.opened && state.assets.opened.type === "folder") {
            return state.assets.opened;
        }
        return null;
    }, [state.assets.opened]);

    const openedLabelPath = useMemo(() => {
        if (!openedFolder) return "";

        const path: string[] = [];
        let currentFolder: typeof openedFolder | null = openedFolder;

        // Track the total length of the final string we are building
        let currentPathLength = 0;

        // Traverse up the tree to build the path
        while (currentFolder && path.length < 3) {
            const folderName = currentFolder.name;

            // If path already has items, we need 3 chars for the " / " separator
            const separatorLen = path.length > 0 ? 3 : 0;
            const additionalLength = folderName.length + separatorLen;

            // Check if appending this folder exceeds the MAX_PATH_LENGTH character limit
            if (currentPathLength + additionalLength > MAX_PATH_LENGTH) {
                // Calculate how many characters from this folder name we can still fit.
                // We subtract 3 for the "..." string.
                const charsAllowed = MAX_PATH_LENGTH - currentPathLength - separatorLen - 3;

                if (charsAllowed > 0) {
                    // Keep the end of the folder name so it fits the limit perfectly
                    path.unshift("..." + folderName.slice(-charsAllowed));
                } else {
                    // If we don't even have space for the name, just add the ellipsis
                    path.unshift("...");
                }

                break; // Stop looking for parents
            }

            // If it fits, add it normally
            path.unshift(folderName);
            currentPathLength += additionalLength;

            // Move to parent
            if (currentFolder.parentId) {
                const parent = state.assets.collection.get(currentFolder.parentId);
                if (parent && parent.type === "folder") {
                    currentFolder = parent;
                } else {
                    currentFolder = null;
                }
            } else {
                currentFolder = null;
            }
        }

        return path.join(" / ");
    }, [openedFolder, state.assets.collection]);


    const fetchAssets = useCallback(async () => {
        if (delayUXLoading.current) {
            clearTimeout(delayUXLoading.current);
            delayUXLoading.current = null;
        }
        try {
            setLoading(true);
            const folderId = openedFolder ? openedFolder.id : null;

            const url = new URL("/api/assets", window.location.origin);
            if (folderId) {
                url.searchParams.append("folderId", folderId);
            }
            const result = await fetch(url.toString());
            const response = await result.json();
            if (!response.success || Array.isArray(response.data) === false) {
                throw new Error(response.message || "Failed to fetch assets.");
            }
            const isValid = Array.isArray(response.data) && response.data.every((asset: any) => asset.id && asset.name && ["file", "folder"].includes(asset.type));
            if (!isValid) {
                throw new Error("Invalid asset data format received from the server.");
            }
            dispatch({ type: "SET_ASSETS", payload: new Map(response.data.map((asset: any) => [asset.id, asset])) });
        } catch (error: any) {
            console.error("Error fetching assets:", error);
            setError(error.message || "An error occurred while fetching assets.");
        } finally {
            delayUXLoading.current = setTimeout(() => setLoading(false), 300); // Add a slight delay for better UX
        }
    }, [openedFolder, dispatch]);

    const handleBackToParentFolder = useCallback(() => {
        if (openedFolder) {
            const parentId = openedFolder.parentId;
            if (parentId) {
                const parentFolder = state.assets.collection.get(parentId);
                if (parentFolder && parentFolder.type === "folder") {
                    dispatch({ type: "SET_OPENED_ASSET", payload: parentFolder });
                } else {
                    dispatch({ type: "SET_OPENED_ASSET", payload: null });
                }
            } else {
                dispatch({ type: "SET_OPENED_ASSET", payload: null });
            }
        }
    }, [openedFolder, state.assets.collection, dispatch]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

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
                <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
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
            <AnimatePresence>
                {openedFolder && (
                    <Box
                        component={motion.div}
                        layoutId={`asset-${openedFolder.id}`}
                        sx={{ }}>
                        <Box onDoubleClick={handleBackToParentFolder}
                            sx={{
                                fontSize: 10,
                                p: 1, display: "flex", alignItems: "center", gap: .5,
                                mx: 1,
                                mb: .25,
                                cursor: "pointer",
                                userSelect: "none",
                                overflow: "hidden",
                                "&:hover": {
                                    backgroundColor: "action.hover"
                                }
                            }}>
                            <LucideFolderOutput size={16} style={{ marginRight: 4 }} />
                            <Typography variant="body2" sx={{ fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {"... / "}{openedLabelPath}
                            </Typography>
                        </Box>
                        <Divider />
                    </Box>
                )}
            </AnimatePresence>
            <DragAndDropZone>
                <ScrollContainer sx={{ pt: 1 }}>
                    {error && (
                        <Typography variant="body2" color="error" sx={{
                            fontSize: 12,
                            mb: 1,
                            bgcolor: "rgba(255, 0, 0, 0.1)",
                            borderRadius: .5, p: 1, mx: 1
                        }}>
                            {error}
                        </Typography>
                    )}
                    <AssetContents loading={loading} />
                </ScrollContainer>
            </DragAndDropZone>
        </Stack>
    );
}