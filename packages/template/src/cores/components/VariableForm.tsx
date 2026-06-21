import { Box, Grid, TextField, MenuItem, Typography } from "@mui/material";
import Switch from "./Switch";
import { Editor } from "@merapihost/code";
import { useCallback } from "react";

type VariableFormProps = {
    data: Record<string, any>;
    onChange?: (data: Record<string, any>) => void;
}

export default function VariableForm({ data, onChange }: VariableFormProps) {

    const handleChange = useCallback((key: string, value: any) => {
        const newData = { ...data, [key]: value };
        if (key === "type" && value !== data.type) {
            if (value === "boolean") {
                newData.value = false;
            } else if (value === "number") {
                newData.value = 0;
            } else if (value === "json") {
                newData.value = {};
            } else {
                newData.value = "";
            }
        }
        onChange?.(newData);
    }, [data, onChange]);

    return (
        <Box>
            <Grid container spacing={2} sx={{ p: 2 }}>
                <Grid size={7}>
                    <TextField
                        variant="outlined"
                        size="small"
                        fullWidth
                        label="Variable Name"
                        value={data.name || ""}
                        onChange={(e) => handleChange("name", e.target.value)} />
                </Grid>
                <Grid size={5}>
                    <TextField
                        variant="outlined"
                        size="small"
                        fullWidth
                        label="Type"
                        select
                        value={data.type || ""}
                        onChange={(e) => handleChange("type", e.target.value)}>
                        <MenuItem value="string">String</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="source">Source</MenuItem>
                    </TextField>
                </Grid>
            </Grid>
            <Box sx={{ p: 2, pt: 0 }}>
                {data.type === "string" ? (
                    <TextField
                        variant="outlined"
                        size="small"
                        fullWidth
                        multiline
                        rows={4}
                        label="Value"
                        value={data.value || ""}
                        sx={{
                            "& .MuiFormLabel-root": {
                                top: '1rem'
                            }
                        }}
                        onChange={(e) => handleChange("value", e.target.value)} />
                ) : data.type === "number" ? (
                    <TextField
                        variant="outlined"
                        size="small"
                        fullWidth
                        label="Value"
                        type="number"
                        value={data.value || ""}
                        onChange={(e) => handleChange("value", Number(e.target.value))} />
                ) : data.type === "boolean" ? (
                    <Box sx={{ display: "flex", alignItems: "center", p: 1 }}>
                        <Switch
                            checked={data.value || false}
                            onChange={(checked) => handleChange("value", checked)} />
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 1, display: "inline-block" }}>
                            {data.value ? "True" : "False"}
                        </Typography>
                    </Box>
                ) : data.type === "json" ? (
                    <Editor
                        value={typeof data.value === "object" ? JSON.stringify(data.value, null, 2) : String(data.value || "")}
                        onChange={(val) => {
                            try {
                                const parsed = JSON.parse(val);
                                handleChange("value", parsed);
                            } catch (err) {
                                // Jika JSON tidak valid, simpan sebagai string biasa
                                handleChange("value", val);
                            }
                        }} />
                ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                        No editor for this type of variable. The value will be stored as a JSON string.
                    </Typography>
                )}
            </Box>
        </Box>
    );
}