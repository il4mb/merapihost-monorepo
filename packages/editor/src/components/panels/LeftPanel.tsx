import { Box, Tooltip } from "@mui/material";
import { Component, FileText, Image, ListTree, Plus } from "lucide-react";
import { useState } from "react";
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

type LeftPanelProps = {

}
export default function LeftPanel(props: LeftPanelProps) {

    const [selectedMenu, setSelectedMenu] = useState<MenuType>("navigator");
    const handleMenuClick = (menuId: MenuType) => {
        setSelectedMenu(menuId);
    };

    const renderContent = () => {
        switch (selectedMenu) {
            case "blocks":
                return <BlocksManager />;
            case "pages":
                return <PagesManager />;
            case "navigator":
                return <TreeManager />;
            case "assets":
                return <AssetsManager />;
            case "fragments":
                return <FragmentsManager />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{
            width: "100%",
            maxWidth: "260px",
            height: "100%",
            display: "flex",
            flexDirection: "row"
        }}>
            <Box sx={{
                width: "48px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                borderRight: "1px solid rgba(0, 0, 0, 0.1)",
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
                                    color: selectedMenu === item.id ? "primary.main" : "text.primary"
                                }} />
                        </Box>
                    </Tooltip>
                ))}
            </Box>
            <Box sx={{
                flex: 1,
                height: "100%",
                overflowY: "auto"
            }}>
                {renderContent()}
            </Box>
        </Box>
    );
}