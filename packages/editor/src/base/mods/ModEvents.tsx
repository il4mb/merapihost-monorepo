import { Modifier } from "../../type";
import { createModifierComponent } from "../../tools";
import { Fragment } from "react/jsx-runtime";
import { ExtendedRow } from "../../cores/Modifier";
import ActionWidget from "../../cores/styles/components/ActionWidget";
import { ChevronDown, Pen, Plus } from "lucide-react";
import { alpha, Box, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import PickField from "../../cores/styles/components/PickField";

const DOM_EVENTS = [
    "onClick",
    "onDoubleClick",
    "onMouseDown",
    "onMouseUp",
    "onMouseEnter",
    "onMouseLeave",
    "onKeyDown",
    "onKeyUp",
    "onFocus",
    "onBlur",
    "onChange",
    "onInput",
    "onSubmit",
    "onScroll",
    "onWheel",
    "onResize",
    "onError",
    "onLoad"
]

type EventsValue = {
    name: string;
    handler: string;
}
const metadata: Modifier<EventsValue[]> = {
    id: "events",
    name: "Events",
    category: "Behavior",
    onRetrieve: (props) => {
        if (!props.events) return [];
        return Array.isArray(props.events) ? props.events : [];
    },
    onApply: (value, { applier, node }) => {
        const events = node.data.props.events ? [...node.data.props.events] : [];
        for (const event of value) {
            const existingIndex = events.findIndex((e: EventsValue) => e.name === event.name);
            if (existingIndex !== -1)
                events[existingIndex] = event; // Update existing event
            else
                events.push(event); // Add new event
        }
        console.log("Applying events:", events);
        applier({ events })
    }
}

export default createModifierComponent(metadata, ({ value, onChange }) => {

    const [expand, setExpand] = useState(false);
    const theme = useTheme();
    const eventsOptions = DOM_EVENTS.map(ev => ({ name: ev, value: ev, disabled: value.some(e => e.name === ev) }));
    const canAddMore = value.length < DOM_EVENTS.length;

    const toggleExpand = () => setExpand(prev => !prev);

    const addEvent = () => {
        const availableEvents = DOM_EVENTS.filter(ev => !value.some(e => e.name === ev));
        if (availableEvents.length === 0) return; // No more events to add
        const newEvent: EventsValue = { name: availableEvents[0], handler: "console.log('Event triggered!')" };
        onChange([...value, newEvent]);
        if (!expand) setExpand(true);
    }

    return (
        <Fragment>
            <Fragment key={"header"}>
                <ActionWidget
                    color={expand ? "primary" : "default"}
                    icon={
                        <Box
                            component={ChevronDown}
                            sx={{
                                transform: expand ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s"
                            }}
                            size={12}
                        />
                    }
                    onClick={toggleExpand}
                />
                <ActionWidget
                    color="primary"
                    icon={<Plus size={12} />}
                    onClick={addEvent}
                    disabled={!canAddMore}
                />
            </Fragment>

            {expand && (
                <ExtendedRow
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        pl: 2
                    }}>
                    {value.length === 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: 12, opacity: 0.7 }}>
                                No Events available.
                                <br />
                                Click the <Plus size={12} /> icon to add an event listener.
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 1 }}>
                        {value.map((event, index) => (
                            <Box key={index} sx={{
                                display: "flex", gap: 1, alignItems: "center", justifyContent: "space-between",
                                border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                                borderRadius: 1,
                                px: 1, py: 0.5,
                            }}>
                                <PickField
                                    options={eventsOptions}
                                    value={event.name}
                                    onChange={(newName) => {
                                        const updatedEvents = [...value];
                                        updatedEvents[index].name = newName;
                                        onChange(updatedEvents);
                                    }}
                                />
                                <Box sx={{ display: "flex", flexDirection: "row", justifySelf: "flex-end", alignSelf: "stretch", gap: 1, alignItems: "center", color: "text.secondary" }}>
                                    <Typography variant="caption" sx={{}}>
                                        script
                                    </Typography>
                                    <Pen size={12} style={{ marginBottom: 4 }} />
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </ExtendedRow>
            )}
        </Fragment>
    );
});