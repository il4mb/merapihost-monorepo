import { alpha, Box, SxProps, useTheme } from "@mui/material";
import NumberField from "./NumberField";
import { useEffect, useMemo, useRef, useState } from "react";
import PickField from "./PickField";


const UNITS = [
    { name: "num", value: "" },
    { name: "px", value: "px" },
    { name: "%", value: "%" },
    { name: "em", value: "em" },
    { name: "rem", value: "rem" },
    { name: "vw", value: "vw" },
    { name: "vh", value: "vh" },
    { name: "vmin", value: "vmin" },
    { name: "vmax", value: "vmax" },
    { name: "cm", value: "cm" },
    { name: "mm", value: "mm" },
    { name: "in", value: "in" },
    { name: "pt", value: "pt" },
    { name: "pc", value: "pc" },
    { name: "ch", value: "ch" },
    { name: "ex", value: "ex" },
    { name: "fr", value: "fr" }
]

interface UnitFieldProps {
    value: string
    units?: ({ name: string; value: string } | string)[]
    onChange: (value: string) => void
    sx?: SxProps
}

export default function UnitField({ value, units = UNITS, onChange, sx }: UnitFieldProps) {

    const theme = useTheme()
    const [isInteracting, setIsInteracting] = useState(false)
    const shouldSyncRef = useRef(true);

    const unitOptions = useMemo(() => {
        if (!units) return []
        return units.map(u => typeof u === "string" ? { name: u, value: u } : u)
    }, [units?.map(u => typeof u === "string" ? u : u.value).join(",")])

    const [number, setNumber] = useState(() => {
        const match = value.match(/^(-?\d*\.?\d+)/)
        return Number(match ? match[1] : "")
    })
    const [unit, setUnit] = useState(() => {
        const match = value.match(/([a-z%]+)$/)
        return match ? match[1] : ""
    })

    const composedValue = `${number}${unit}`;

    useEffect(() => {
        if (!shouldSyncRef.current) {
            shouldSyncRef.current = true;
            return;
        }
        onChange(composedValue);
    }, [composedValue])

    useEffect(() => {
        const match = value.match(/^(-?\d*\.?\d+)/)
        const newNumber = Number(match ? match[1] : "")
        const unitMatch = value.match(/([a-z%]+)$/)
        const newUnit = unitMatch ? unitMatch[1] : ""
        let hasChanged = false;
        if (newNumber !== number) {
            setNumber(newNumber)
            hasChanged = true;
        }
        if (newUnit !== unit) {
            setUnit(newUnit)
            hasChanged = true;
        }
        if (hasChanged) {
            shouldSyncRef.current = false; // Prevent feedback loop when updating from external changes
        }
    }, [value])

    return (
        <Box sx={{
            display: "inline-flex",
            gap: 0.4,
            alignItems: "center",
            outline: "1px solid transparent",
            outlineOffset: "2px",
            borderRadius: "4px",
            padding: "0px 4px",
            "&:hover": {
                outlineColor: isInteracting ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.5),
            },
            outlineColor: isInteracting ? theme.palette.primary.main : alpha(theme.palette.text.secondary, 0.1),
            ...sx
        }}>
            <NumberField
                sx={{ fontSize: "12px" }}
                value={number}
                onChange={setNumber}
                onInteract={setIsInteracting} />
            <PickField
                sx={{ fontSize: "12px" }}
                value={unit}
                options={unitOptions}
                onChange={setUnit}
                onOpenChange={setIsInteracting} />
        </Box>
    );
}