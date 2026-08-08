import { styled, Typography, Divider, Box, LinearProgress } from "@mui/material";
import { useEditor } from "@editor/providers/EditorProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AssetContents from "./AssetContents";
import { LucideFolderOutput } from "lucide-react";

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

const MAX_PATH_LENGTH = 28; // Maximum length for the displayed path
export default function AssetsManager() {

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { state, dispatch } = useEditor();

    const delayUXLoading = useRef<number | null>(null);
    const selectedFolder = useMemo(() => {
        if (state.selectedAsset && state.selectedAsset.type === "folder") {
            return state.selectedAsset;
        }
        return null;
    }, [state.selectedAsset]);

    const selectedLabelPath = useMemo(() => {
        if (!selectedFolder) return "";

        const path: string[] = [];
        let currentFolder: typeof selectedFolder | null = selectedFolder;

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
                const parent = state.assets.get(currentFolder.parentId);
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
    }, [selectedFolder, state.assets]);


    const fetchAssets = useCallback(async () => {
        if (!state.options.assets?.endpoint) return;
        if (delayUXLoading.current) {
            clearTimeout(delayUXLoading.current);
            delayUXLoading.current = null;
        }
        try {
            setLoading(true);
            const folderId = selectedFolder ? selectedFolder.id : null;
            const endpoint = state.options.assets.endpoint;
            const url = new URL(endpoint, window.location.origin);
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
    }, [selectedFolder, state.options.assets?.endpoint, dispatch]);

    const handleBackToParentFolder = useCallback(() => {
        if (selectedFolder) {
            const parentId = selectedFolder.parentId;
            if (parentId) {
                const parentFolder = state.assets.get(parentId);
                if (parentFolder && parentFolder.type === "folder") {
                    dispatch({ type: "SET_SELECTED_ASSET", payload: parentFolder });
                } else {
                    dispatch({ type: "SET_SELECTED_ASSET", payload: null });
                }
            } else {
                dispatch({ type: "SET_SELECTED_ASSET", payload: null });
            }
        }
    }, [selectedFolder, state.assets, dispatch]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    return (
        <Box>
            <Box sx={{ position: 'relative' }}>
                <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
                    Assets
                </Typography>
                <Divider sx={{ mb: 1 }} />
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
            {selectedFolder && (
                <Box>
                    <Box
                        onDoubleClick={handleBackToParentFolder}
                        sx={{
                            fontSize: 10,
                            p: 1, display: "flex", alignItems: "center", gap: .5,
                            mx: 1,
                            mb: .25,
                            cursor: "pointer",
                            userSelect: "none",
                            "&:hover": {
                                backgroundColor: "action.hover"
                            }
                        }}>
                        <LucideFolderOutput size={16} style={{ marginRight: 4 }} />
                        {"... / "}{selectedLabelPath}
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                </Box>
            )}
            <ScrollContainer>
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
        </Box>
    );
}