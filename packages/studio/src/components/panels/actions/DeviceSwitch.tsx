"use client";
import { useStudio } from "@/contexts/StudioProvider";
import { TextField, MenuItem } from "@mui/material";

export default function DeviceSwitch() {
    const { state, dispatch } = useStudio();
    const devices = state.devices;
    const handleDeviceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: "SET_DEVICE", payload: event.target.value });
    }
    return (
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
    );
}
