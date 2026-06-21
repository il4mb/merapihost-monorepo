import { Box, Typography } from "@mui/material"
import { useMemo } from "react"

interface StyledManagerProps {}

export default function StyledManager({}: StyledManagerProps) {
    const properties = useMemo(() => {
        return [
            { name: "color", type: "string", value: "red" },
            { name: "font-size", type: "string", value: "16px" },
            { name: "margin", type: "string", value: "10px" }
        ]
    }, [])

    return (
        <Box>
            <Typography variant="h4">Styled Manager</Typography>
            <Box sx={{ mt: 2 }}>
                <Box component={"code"}>
                    {properties.map(prop => (
                        <Box
                            component={"div"}
                            sx={{
                                display: "flex"
                            }}
                            key={prop.name}>
                            <span>{prop.name}: </span>
                            <input
                                type="text"
                                value={prop.value}
                                onChange={e => {
                                    // Handle value change
                                }}
                                style={{ marginLeft: 8 }}
                            />
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    )
}
