import { Stack, Tooltip } from "@mui/material";
import DeviceSwitch from "./actions/DeviceSwitch";
import DarkModeToggle from "@/theme/DarkModeToggle";
import SaveAction from "./actions/SaveAction";

export default function Toolbar() {


    return (
        <Stack
            direction="row"
            sx={{
                alignItems: 'center',
                justifyContent: "space-between",
                minHeight: 50,
                borderRadius: 0,
                boxShadow: 0
            }}>

            <Stack
                direction="row"
                sx={{
                    alignItems: 'center',
                    gap: 1,
                    paddingLeft: 2
                }}>
                <DeviceSwitch />

            </Stack>

            <Stack
                direction="row"
                sx={{
                    alignItems: 'center',
                    gap: 1, flex: 1
                }}>

            </Stack>

            <Stack
                direction="row"
                sx={{
                    alignItems: 'center',
                    gap: 1,
                    paddingRight: 2
                }}>
                <SaveAction />
                <Tooltip title="Toggle dark mode">
                    <DarkModeToggle />
                </Tooltip>
            </Stack>
        </Stack>
    );
}