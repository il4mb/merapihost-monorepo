import { Box, IconButton, Popover, Stack, Typography } from "@mui/material";
import { Plus } from "lucide-react";
import { useState } from "react";
import TextField from "../../components/TextField";
type EventsManagerProps = {
    typeEvents: string[];
}
export default function EventsManager({ typeEvents }: EventsManagerProps) {

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [events, setEvents] = useState<Map<string, string>>(new Map());

    const handleEventChange = (eventName: string, handler: string) => {
        setEvents(prevEvents => {
            const newEvents = new Map(prevEvents);
            newEvents.set(eventName, handler);
            return newEvents;
        });
    };

    const handleAddEvent = (eventName: string) => {
        if (!events.has(eventName)) {
            handleEventChange(eventName, "");
        }
    };

    const handleRemoveEvent = (eventName: string) => {
        setEvents(prevEvents => {
            const newEvents = new Map(prevEvents);
            newEvents.delete(eventName);
            return newEvents;
        });
    };

    return (
        <Box>
            <Stack spacing={1} sx={{ mb: 1, ml: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Events
                </Typography>
                <IconButton size="small" onClick={e => setAnchorEl(e.currentTarget)}>
                    <Plus size={16} />
                </IconButton>
            </Stack>
            <Stack spacing={1}>
                {Array.from(events.entries()).map(([eventName, handler]) => (
                    <Stack key={eventName} spacing={1} direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="body2">
                            {eventName}
                        </Typography>
                        <Box sx={{ flex: '0 1 70%' }}>
                            <TextField
                                placeholder={`Handler for ${eventName}`}
                                value={handler}
                                onChange={(e) => handleEventChange(eventName, e.target.value)}
                            />
                        </Box>
                        <IconButton size="small" onClick={() => handleRemoveEvent(eventName)}>
                            <Typography variant="body2" color="error">Remove</Typography>
                        </IconButton>
                    </Stack>
                ))}
            </Stack>

            <Popover
                anchorEl={anchorEl}
                open={!!anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
                <Box>
                    {typeEvents.filter(eventName => !events.has(eventName)).map((eventName, i) => (
                        <Typography
                            variant="body2"
                            key={eventName}
                            onClick={() => { handleAddEvent(eventName); setAnchorEl(null); }}
                            sx={{
                                display: "block",
                                cursor: "pointer",
                                '&:hover': {
                                    backgroundColor: "action.hover",
                                },
                                px: 2,
                                mt: i === 0 ? 1 : 0.5,
                                mb: i === typeEvents.length - 1 ? 2 : 0.5,
                                py: 0.25,
                                borderRadius: 1
                            }}>
                            {eventName}
                        </Typography>
                    ))}
                </Box>
            </Popover>
        </Box>
    );
}