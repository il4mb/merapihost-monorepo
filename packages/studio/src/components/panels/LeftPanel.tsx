"use client";
import Panel from "@/components/ui/Panel";
import { Tooltip, Box, Stack } from "@mui/material";
import { Plus, FileText, ListTree, Image, Component } from "lucide-react";
import { memo, useState } from "react";
import { AssetsManager, BlocksManager, FragmentsManager, PagesManager, TreeManager } from "./contents";

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

const Sidebar = memo(({ selected, onClick }: { selected: MenuType; onClick: (id: MenuType) => void }) => (
    <Box sx={{
        width: "48px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        borderRight: "1px solid rgba(0, 0, 0, 0.1)",
        zIndex: 10, // Ensure the sidebar stays above the absolute content
        // backgroundColor: "background.paper", // Prevent transparent overlaps
    }}>
        {MENU.map((item, index) => (
            <Tooltip key={index} title={item.label} placement="right" arrow>
                <Box
                    onClick={() => onClick(item.id)}
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
                            color: selected === item.id ? "primary.main" : "text.primary",
                            transition: "color 0.2s ease"
                        }} />
                </Box>
            </Tooltip>
        ))}
    </Box>
))

const ContentArea = memo(({ selected }: { selected: MenuType }) => (
    <Stack sx={{ flex: 1, overflow: "hidden" }} direction="column" spacing={0}>
        {getComponent(selected)}
    </Stack>
))

export default function LeftPanel() {

    const [selectedMenu, setSelectedMenu] = useState<MenuType>("pages");
    const handleMenuClick = (menuId: MenuType) => {
        setSelectedMenu(menuId);
    }

    return (
        <Panel
            slotProps={{
                content: {
                    sx: { flexDirection: 'row' }
                }
            }}
            initialWidth={300}
            minWidth={200}
            maxWidth={400}
            resizeable>

            <Sidebar
                selected={selectedMenu}
                onClick={handleMenuClick} />

            <ContentArea
                selected={selectedMenu} />
        </Panel>
    );
}