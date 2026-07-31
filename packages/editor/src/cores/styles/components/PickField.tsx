import { styled, SxProps, Typography } from "@mui/material"
import { ChevronDown } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "motion/react"
import Floating from "../../Floating"

// --- Styled Components ---
const Container = styled("div")(({ theme }) => ({
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 500,
    transition: "background-color 0.2s ease",
    userSelect: "none",
}))

// Notice we wrap motion.div with MUI's styled utility
const DropdownContainer = styled(motion.div)(({ theme }) => ({
    marginTop: "6px",
    minWidth: "50px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "4px",
    zIndex: 1000,
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    border: "1px solid #f0f0f0",
    transformOrigin: "top left",
    ...theme.applyStyles("dark", {
        backgroundColor: "#1e1e1e",
        borderColor: "#2d2d2d",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
    })
}))

const DropdownItem = styled(motion.div)<{ isSelected?: boolean }>(({ theme, isSelected }) => ({
    fontSize: "12px",
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "background-color 0.15s ease",
    color: isSelected ? "#ff00f2" : "#444",
    backgroundColor: isSelected ? "rgba(255, 0, 242, 0.08)" : "transparent",
    fontWeight: isSelected ? 600 : 400,
    "&:hover": {
        backgroundColor: isSelected ? "rgba(255, 0, 242, 0.12)" : "#f5f5f5",
    },
    ...theme.applyStyles("dark", {
        color: isSelected ? "#ff66f5" : "#ccc",
        backgroundColor: isSelected ? "rgba(255, 102, 245, 0.15)" : "transparent",
        "&:hover": {
            backgroundColor: isSelected ? "rgba(255, 102, 245, 0.2)" : "#2a2a2a",
        }
    })
}))

const Indicator = styled(motion.div)({
    position: "absolute",
    right: "-12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
    opacity: 0,
})

interface PickFieldProps {
    value: string
    options: {
        name: string
        value: string
        disabled?: boolean
    }[]
    sx?: SxProps
    onChange: (value: string) => void
    onOpenChange?: (open: boolean) => void
}

export default function PickField({ value, options, onChange, onOpenChange, sx }: PickFieldProps) {


    const containerRef = useRef<HTMLDivElement>(null)
    const [label, setLabel] = useState(options.find(opt => opt.value === value)?.name || "N/A")
    const [hovered, setHovered] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const currentOption = options.find(opt => opt.value === value)
        if (currentOption) setLabel(currentOption.name)
    }, [value, options])

    useEffect(() => {
        if (onOpenChange) onOpenChange(open)
    }, [open, onOpenChange])

    const toggleOpen = () => setOpen(prev => !prev)
    const onMouseEnter = () => setHovered(true)

    const handleOptionClick = useCallback((optValue: string, optName: string) => {
        setLabel(optName)
        onChange(optValue)
        setOpen(false)
    }, [onChange])

    useEffect(() => {
        if (!open) return
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open])

    useEffect(() => {
        if (!hovered || !containerRef.current) return
        const handleMouseMove = (e: MouseEvent) => {
            const rect = containerRef.current!.getBoundingClientRect();
            const isInRect = (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            );
            if (!isInRect) {
                setHovered(false);
            }
        }
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [hovered])

    return (
        <Container
            ref={containerRef}
            onMouseEnter={onMouseEnter}
            onClick={toggleOpen}
            sx={sx}>
            <Typography component={"span"} sx={{ fontSize: "inherit", fontWeight: "inherit" }}>
                {label}
            </Typography>

            <Indicator
                animate={{
                    rotate: open ? 180 : 0,
                    y: hovered || open ? -2 : 0,
                    x: hovered || open ? 10 : 0,
                    opacity: hovered || open ? 1 : 0
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                sx={{ color: hovered || open ? "primary.main" : "text.secondary" }}>
                <ChevronDown size={14} strokeWidth={2.5} />
            </Indicator>
            <Floating
                open={open}
                anchor={containerRef}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center"
                }}>
                <DropdownContainer
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                    }}>
                    {options.map((opt, index) => {
                        const isSelected = opt.value === value;
                        return (
                            <DropdownItem
                                key={opt.value}
                                isSelected={isSelected}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: opt.disabled ? 0.4 : 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                sx={{
                                    pointerEvents: opt.disabled ? "none" : "auto",
                                    color: opt.disabled ? "text.disabled" : isSelected ? "primary.main" : "text.primary",
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOptionClick(opt.value, opt.name);
                                }}>
                                {opt.name}
                            </DropdownItem>
                        )
                    })}
                </DropdownContainer>
            </Floating>
        </Container>
    );
}