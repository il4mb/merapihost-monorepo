import { Stack } from "@mui/material";

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

            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, paddingLeft: 2 }}>

            </Stack>

            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            </Stack>

            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, paddingRight: 2 }}>
            </Stack>
        </Stack>
    );
}