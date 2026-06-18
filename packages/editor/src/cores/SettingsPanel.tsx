import { Box, Chip, Grid, Typography, Button as MaterialButton, FormControl, FormLabel, Slider } from "@mui/material";

export const SettingsPanel = () => {
    return (
        <Box sx={{ bgcolor: "rgba(0, 0, 0, 0.06)", mt: 2, px: 2, py: 2 }}>
            <Grid container sx={{ flexDirection: "column" }} spacing={0}>
                <Grid>
                    <Box sx={{ pb: 2 }}>
                        <Grid container sx={{ alignItems: "center" }}>
                            <Grid size={6}>
                                <Typography variant="subtitle1">Selected</Typography>
                            </Grid>
                            <Grid>
                                <Chip
                                    size="small"
                                    color="primary"
                                    label="Selected"
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
                <FormControl size="small" component="fieldset">
                    <FormLabel component="legend">Prop</FormLabel>
                    <Slider
                        defaultValue={0}
                        step={1}
                        min={7}
                        max={50}
                        valueLabelDisplay="auto"
                    />
                </FormControl>
                <MaterialButton variant="contained" color="secondary">
                    Delete
                </MaterialButton>
            </Grid>
        </Box>
    );
};
