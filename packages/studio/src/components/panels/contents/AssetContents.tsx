import { useStudio } from "@/contexts/StudioProvider";
import { AssetObject } from "@/types";
import { Box } from "@mui/material";
import { FolderIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo } from "react";

type AssetContentsProps = {
    loading?: boolean;
};

export default function AssetContents({ loading }: AssetContentsProps) {
    const { state } = useStudio();
    const assets = useMemo(() => {
        if (state.assets.opened && state.assets.opened.type === "folder") {
            const folderId = state.assets.opened.id;
            return Array.from(state.assets.collection.values()).filter(asset => asset.parentId === folderId);
        }
        return Array.from(state.assets.collection.values()).filter(asset => asset.parentId === null);
    }, [state.assets, state.assets.collection]);

    const shouldShowEmptyState = useMemo(() => {
        return !loading && assets.length === 0;
    }, [loading, assets]);

    return (
        <AnimatePresence initial={false} mode="wait">
            {shouldShowEmptyState ? (
                <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    key="empty-state"
                    sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "text.secondary", fontSize: 12, textAlign: "center", userSelect: "none", p: 2 }}>
                    <FolderIcon size={32} style={{ marginBottom: 8 }} />
                    No assets found in this folder.
                </Box>
            ) : (
                <Box
                    key="asset-grid"
                    component={motion.div}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: .5, px: 1 }}>
                    {assets.map(asset => (
                        <AssetItem key={asset.id} asset={asset} />
                    ))}
                </Box>
            )}
        </AnimatePresence>
    );
}

const AssetItem = ({ asset }: { asset: AssetObject }) => {

    const { state, dispatch } = useStudio();
    const isSelected = state.assets.selected?.id === asset.id;

    const handleDoubleClick = useCallback((asset: AssetObject) => {
        dispatch({ type: "SET_OPENED_ASSET", payload: asset });
    }, [dispatch]);

    const handleClick = useCallback((asset: AssetObject) => {
        dispatch({ type: "SET_SELECTED_ASSET", payload: asset });
    }, [dispatch]);

    return (
        <Box
            component={motion.div}
            layoutId={`asset-${asset.id}`}
            onDoubleClick={() => handleDoubleClick(asset)}
            onClick={() => handleClick(asset)}
            sx={{
                // Conditionally span 3 columns if the asset is a folder
                gridColumn: asset.type === "folder" ? "span 3" : "auto",

                fontSize: 10,
                padding: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: .25,

                // Prevents long text from breaking the grid column width
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",

                // Added flex for better vertical alignment with the icon
                display: "flex",
                alignItems: "center",
                userSelect: "none", // Prevents text selection on click
                backgroundColor: isSelected ? "primary.main" : "transparent",
                color: isSelected ? "primary.contrastText" : "text.primary",
                "&:hover": {
                    backgroundColor: isSelected ? "primary.dark" : "action.hover",
                    cursor: "pointer"
                }
            }}>
            {asset.type === "folder" && (
                <FolderIcon size={16} style={{ marginRight: 6 }} />
            )}
            {asset.name}
        </Box>
    );
}