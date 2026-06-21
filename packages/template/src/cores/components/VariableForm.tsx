import { Box, Grid, TextField, MenuItem, Typography } from "@mui/material";
import Switch from "./Switch";
import { Editor } from "@monaco-editor/react";
import { useCallback } from "react";

type VariableFormProps = {
    data: Record<string, any>;
    onChange?: (data: Record<string, any>) => void;
}

export default function VariableForm({ data, onChange }: VariableFormProps) {

    const handleChange = useCallback((key: string, value: any) => {
        onChange?.({ ...data, [key]: value });
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
                        theme="vs-dark"
                        defaultLanguage="json"
                        height="175px"
                        defaultValue="{}"
                        value={JSON.stringify(data.value || {}, null, 2)}
                        onChange={(value) => {
                            try {
                                const parsed = JSON.parse(value || "{}");
                                handleChange("value", parsed);
                            } catch (e) {
                                console.error("Invalid JSON", e);
                            }
                        }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 12,
                            scrollbar: {
                                vertical: "hidden",
                                horizontal: "hidden"
                            },
                            lineNumbers: "off",
                            scrollBeyondLastLine: false,
                            showFoldingControls: "never",
                            wordWrap: "on",
                            wrappingIndent: "indent"
                        }}
                    />
                ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ p: 2 }}>
                        No editor for this type of variable. The value will be stored as a JSON string.
                    </Typography>
                )}
            </Box>
        </Box>
    );
}