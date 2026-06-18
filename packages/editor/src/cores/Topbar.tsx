import { Box, styled, TextField, MenuItem, IconButton, Tooltip } from "@mui/material"
import { useEditor } from "./EditorProvider"
import { Eye, Moon } from "lucide-react"
const Container = styled("div")({
    padding: "4px 8px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
})
export const Topbar = () => {
    const { state, dispatch } = useEditor()
    const devices = state.devices
    const handleDeviceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: "SET_DEVICE", payload: event.target.value })
    }
    return (
        <Container>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TextField
                    variant="outlined"
                    size="small"
                    slotProps={{
                        select: {
                            sx: {
                                width: "120px"
                            }
                        }
                    }}
                    select
                    value={state.device}
                    onChange={handleDeviceChange}>
                    {devices.map(device => (
                        <MenuItem key={device.id} value={device.id}>
                            {device.name}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginLeft: "auto" }}>
                <Tooltip title="Preview" arrow>
                    <IconButton color="secondary">
                        <Eye size={16} />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Dark Mode" arrow>
                    <IconButton color="secondary">
                        <Moon size={16} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Container>
    )
}
