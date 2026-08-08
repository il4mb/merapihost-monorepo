import { Box, Tooltip } from "@mui/material";
import { Component, FileText, Image, ListTree, Plus } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import TreeManager from "./contents/TreesManager";
import AssetsManager from "./contents/AssetsManager";
import BlocksManager from "./contents/BlocksManager";
import PagesManager from "./contents/PagesManager";
import FragmentsManager from "./contents/FragmentsManager";

const MENU = [
    {
        id: "blocks",
        label: "Blocks",
        icon: Plus
    },
    {
        id: "pages",
        label: "Pages",
        icon: FileText
    },
    {
        id: "navigator",
        label: "Navigator",
        icon: ListTree,
    },
    {
        id: "assets",
        label: "Assets",
        icon: Image,
    },
    {
        id: "fragments",
        label: "Fragments",
        icon: Component,
    }
] as const;

type MenuType = typeof MENU[number]['id'];

type LeftPanelProps = {}

// Helper to map menu ID to the corresponding component
const getComponent = (id: MenuType) => {
    switch (id) {
        case "blocks": return <BlocksManager />;
        case "pages": return <PagesManager />;
        case "navigator": return <TreeManager />;
        case "assets": return <AssetsManager />;
        case "fragments": return <FragmentsManager />;
        default: return null;
    }
};

export default function LeftPanel(props: LeftPanelProps) {
    const [selectedMenu, setSelectedMenu] = useState<MenuType>("navigator");

    const handleMenuClick = (menuId: MenuType) => {
        setSelectedMenu(menuId);
    };

    return (
        <Box sx={{
            width: "100%",
            maxWidth: "260px",
            height: "100%",
            display: "flex",
            flexDirection: "row"
        }}>
            {/* Sidebar Navigation */}
            <Box sx={{
                width: "48px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                borderRight: "1px solid rgba(0, 0, 0, 0.1)",
                zIndex: 10, // Ensure the sidebar stays above the absolute content
                backgroundColor: "background.paper", // Prevent transparent overlaps
            }}>
                {MENU.map((item, index) => (
                    <Tooltip key={index} title={item.label} placement="right" arrow>
                        <Box
                            onClick={() => handleMenuClick(item.id)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "40px",
                                height: "40px",
                                cursor: "pointer",
                                "&:hover": {
                                    backgroundColor: "rgba(0, 0, 0, 0.05)"
                                }
                            }}>
                            <Box
                                component={item.icon}
                                sx={{
                                    width: "20px",
                                    height: "20px",
                                    color: selectedMenu === item.id ? "primary.main" : "text.primary",
                                    transition: "color 0.2s ease"
                                }} />
                        </Box>
                    </Tooltip>
                ))}
            </Box>

            {/* Content Area - All components stay mounted */}
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                height: "100%",
                position: "relative",
                overflow: "hidden" // Parent hides overflow, children scroll independently
            }}>
                {MENU.map((item) => {
                    const isSelected = selectedMenu === item.id;

                    return (
                        <motion.div
                            key={item.id}
                            initial={false}
                            animate={{
                                opacity: isSelected ? 1 : 0,
                                x: isSelected ? 0 : -10,
                                zIndex: isSelected ? 1 : 0,
                            }}
                            transition={{
                                duration: 0.2,
                                ease: "easeInOut"
                            }}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                // Prevent interaction with hidden elements
                                pointerEvents: isSelected ? "auto" : "none",
                                // Only allow the active component to scroll
                                overflowY: isSelected ? "auto" : "hidden",
                            }}>
                            {getComponent(item.id)}
                        </motion.div>
                    );
                })}
            </Box>
        </Box>
    );
}