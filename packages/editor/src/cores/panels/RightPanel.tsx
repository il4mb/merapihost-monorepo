import { Box, Typography } from "@mui/material";
import SettingsManager from "./contents/SettingsManager";
import { useState } from "react";

const MENU = [
    {
        id: "styles",
        label: "Styles",
    },
    {
        id: "settings",
        label: "Settings",
    },
] as const;
type MenuType = typeof MENU[number]['id'];

export default function RightPanel() {
    const [selectedMenu, setSelectedMenu] = useState<MenuType>("settings");
    const handleMenuClick = (menuId: MenuType) => {
        setSelectedMenu(menuId);
    }

    const renderContent = () => {
        switch (selectedMenu) {
            case "styles":
                return <Box>Styles</Box>;
            case "settings":
                return <SettingsManager />;
            default:
                return null;
        }
    }

    return (
        <Box sx={{ width: 230, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", flexDirection: "row", borderBottom: "1px solid #ccc" }}>
                {MENU.map(menu => {
                    const isSelected = selectedMenu === menu.id;
                    return (
                        <Box key={menu.id}>
                            <Typography
                                onClick={() => handleMenuClick(menu.id)}
                                variant="overline"
                                sx={{
                                    px: 1,
                                    display: "block",
                                    fontWeight: isSelected ? 800 : 400,
                                    cursor: "pointer",
                                    color: isSelected ? "primary.main" : "text.secondary",
                                }}>
                                {menu.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
            <Box sx={{ flex: 1, overflowY: "auto" }}>
                {renderContent()}
            </Box>
        </Box>
    );
}