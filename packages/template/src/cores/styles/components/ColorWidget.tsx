import { styled, Typography, Box, useTheme } from "@mui/material"
import { Pipette } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { RgbaColorPicker } from "react-colorful"
import { colord, extend } from "colord"
import namesPlugin from "colord/plugins/names"
import Floating from "../../Floating"

extend([namesPlugin])

const Container = styled("div")(({ theme }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    position: "relative",
    cursor: "pointer",
    fontSize: "12px",
    borderRadius: "12px",
    fontWeight: 500,
    transition: "all 0.2s ease",
    userSelect: "none",
    ...theme.applyStyles("dark", {})
}))

const ColorSwatch = styled("div")(({ theme }) => ({
    width: "15px",
    height: "15px",
    borderRadius: "4px",
    border: "2px solid rgba(0,0,0,0.05)",
    backgroundImage: `conic-gradient(rgba(0,0,0,0.06) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.06) 75%, transparent 75%, transparent)`,
    backgroundSize: "8px 8px",
    position: "relative",
    overflow: "hidden",
    ...theme.applyStyles("dark", {
        borderColor: "rgba(255,255,255,0.1)",
        backgroundImage: `conic-gradient(rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)`,
    })
}))

const ColorFill = styled("div")({
    position: "absolute",
    inset: 0,
})

const InputRow = styled("div")({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "12px",
})

const StyledInput = styled("input")(({ theme }) => ({
    width: "100%",
    fontSize: "12px",
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    outline: "none",
    fontFamily: "monospace",
    color: "#333",
    backgroundColor: "#fafafa",
    "&:focus": {
        borderColor: theme.palette.primary.main,
    },
    ...theme.applyStyles("dark", {
        backgroundColor: "#111",
        borderColor: "#444",
        color: "#fff",
    })
}))

const ColorLabel = styled("span")(({ theme }) => ({
    fontSize: "12px",
    maxWidth: "180px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textTransform: "uppercase",
    color: "#333",
    fontWeight: 500,
    ...theme.applyStyles("dark", {
        color: "#e0e0e0",
    })
}))

const PipetteButton = styled("button")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "none",
    border: "none",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#888",
    transition: "all 0.15s ease",
    "&:hover": {
        backgroundColor: "rgba(0,0,0,0.05)",
        color: "#333",
    },
    "&:active": {
        transform: "scale(0.95)",
    },
    ...theme.applyStyles("dark", {
        color: "#aaa",
        "&:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
            color: "#fff",
        }
    })
}))

type ColorPickerProps = {
    width?: number | string
    height?: number | string
}

const StyledColorPicker = styled(
    RgbaColorPicker, {
    shouldForwardProp: (prop) => !['width', 'height'].includes(String(prop))
}
)<ColorPickerProps>(({ width, height }) => ({
    "&.react-colorful": {
        width: width || "200px",
        height: height || "180px",
        borderRadius: "12px",
    },
    "& .react-colorful__saturation": {
        borderRadius: "12px",
        "& .react-colorful__saturation-pointer": {
            width: "14px",
            height: "14px",
            border: "2px solid #fff",
            boxShadow: "0 0 2px rgba(0,0,0,0.3)",
        },
    },
    "& .react-colorful__hue": {
        marginTop: "8px",
        height: "14px",
        borderRadius: "7px",
        "& .react-colorful__hue-pointer": {
            width: "14px",
            height: "14px",
            border: "2px solid #fff",
            boxShadow: "0 0 2px rgba(0,0,0,0.3)",
        },
    },
    "& .react-colorful__alpha": {
        marginTop: "4px",
        height: "14px",
        borderRadius: "7px",
        "& .react-colorful__alpha-pointer": {
            width: "14px",
            height: "14px",
            border: "2px solid #fff",
            boxShadow: "0 0 2px rgba(0,0,0,0.3)",
        },
    },
}))

interface ColorWidgetProps {
    value: string
    onChange: (value: string) => void
    pickerProps?: ColorPickerProps
}

export default function ColorWidget({ value, onChange, pickerProps }: ColorWidgetProps) {

    const theme = useTheme()
    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [localString, setLocalString] = useState(value);

    // Check if the browser supports the native EyeDropper API
    const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false);

    const parsedColor = colord(value)
    const originalFormat = value.startsWith("hsl") ? "hsl" : value.startsWith("rgb") ? "rgb" : "hex"

    useEffect(() => {
        setLocalString(value)
    }, [value])

    useEffect(() => {
        // Run this on mount to avoid Next.js hydration errors
        if ('EyeDropper' in window) {
            setIsEyeDropperSupported(true);
        }
    }, []);

    const handleSpectrumChange = (rgba: { r: number; g: number; b: number; a: number }) => {
        const c = colord(rgba)
        let newColorStr = ""

        if (originalFormat === "hsl") {
            newColorStr = c.toHslString()
        } else if (originalFormat === "rgb") {
            newColorStr = c.toRgbString()
        } else {
            newColorStr = rgba.a < 1 ? c.toHex() : c.toHex().slice(0, 7)
        }

        setLocalString(newColorStr)
        onChange(newColorStr)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStr = e.target.value
        setLocalString(newStr)

        const newParsed = colord(newStr)
        if (newParsed.isValid()) {
            onChange(newStr)
        }
    }

    // --- Native EyeDropper Implementation ---
    const handleEyeDropper = async () => {
        try {
            // @ts-ignore - TypeScript might not know about EyeDropper yet
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open(); // Opens the screen magnifier

            // The API returns an sRGBHex. Let's run it through colord to match the user's preferred format!
            const pickedColor = colord(result.sRGBHex);

            let formattedColor = "";
            if (originalFormat === "hsl") {
                formattedColor = pickedColor.toHslString();
            } else if (originalFormat === "rgb") {
                formattedColor = pickedColor.toRgbString();
            } else {
                formattedColor = pickedColor.toHex();
            }

            setLocalString(formattedColor);
            onChange(formattedColor);

        } catch (error) {
            // User pressed 'Escape' to cancel the eyedropper
            console.log("EyeDropper canceled.");
        }
    };

    return (
        <Container ref={containerRef}>
            <Box sx={{
                display: "flex", alignItems: "center", gap: "4px",
                borderRadius: "4px",
                outline: "1px solid transparent",
                outlineOffset: "2px",
                outlineColor: open ? theme.palette.primary.main : "transparent",
                transition: "all 0.15s ease"
            }} onClick={() => setOpen(p => !p)}>
                <ColorSwatch>
                    <ColorFill style={{ backgroundColor: parsedColor.toRgbString() }} />
                </ColorSwatch>
                <ColorLabel>
                    {localString || "Invalid Color"}
                </ColorLabel>
            </Box>

            <Floating
                open={open}
                onClose={() => setOpen(false)}
                anchor={containerRef}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}>
                <Box sx={{ borderRadius: "12px", padding: '14px', bgcolor: "background.paper", boxShadow: 3, width: "fit-content", mt: 0.5 }}>

                    <StyledColorPicker
                        {...pickerProps}
                        color={parsedColor.toRgb()}
                        onChange={handleSpectrumChange}
                    />

                    <InputRow>
                        {/* Conditionally render the Pipette button if the browser supports it */}
                        {isEyeDropperSupported && (
                            <PipetteButton onClick={handleEyeDropper} title="Pick a color from screen">
                                <Pipette size={16} strokeWidth={2.5} />
                            </PipetteButton>
                        )}
                        <StyledInput
                            value={localString}
                            onChange={handleInputChange}
                            spellCheck={false}
                        />
                    </InputRow>

                </Box>
            </Floating>
        </Container>
    )
}