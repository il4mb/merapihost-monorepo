import { IconButton, Paper, Stack, Tooltip } from "@mui/material";
import { Plus, Menu } from "lucide-react";
import { Fragment, useMemo } from "react";
import { useSidebar } from "../SidebarLayout";

export default function Toolbar() {

    const { isOpen, toggleSidebar } = useSidebar();

    return (
        <Stack
            component={Paper}
            elevation={1}
            direction="row"
            sx={{ alignItems: 'center', justifyContent: "space-between", minHeight: 50, borderRadius: 0 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, paddingLeft: 2 }}>
                {!isOpen && (
                    <Tooltip title={"Add Element"}>
                        <IconButton size={"small"} onClick={toggleSidebar}>
                            <Menu size={20} />
                        </IconButton>
                    </Tooltip>
                )}
                <Tooltip title={"Add Element"}>
                    <IconButton size={"small"}>
                        <Plus size={20} />
                    </IconButton>
                </Tooltip>

            </Stack>

            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            </Stack>

            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, paddingRight: 2 }}>
            </Stack>
        </Stack>
    );
}