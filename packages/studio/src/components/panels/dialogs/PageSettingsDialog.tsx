"use client";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, FormHelperText, Switch, TextField, Typography } from "@mui/material";
import { PageObject } from "@/types";
import { useState, useEffect, useCallback } from "react";
import MetaTagEditor from "@/components/ui/fields/MetaTagEditor";
import { enqueueSnackbar } from "notistack";

const EMPTY_DATA = {
    title: "",
    description: "",
    route: "",
    status: "active" as "active" | "inactive",
    meta: null as string | null
}

type PageSettingsDialogProps = {
    page: PageObject | null;
    onClose: () => void;
    onSuccess?: (updatedPage: PageObject) => void;
};

export default function PageSettingsDialog({ page, onClose, onSuccess }: PageSettingsDialogProps) {
    const [showAdvance, setShowAdvance] = useState(false);
    const [data, setData] = useState(EMPTY_DATA);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (page) {
            setData({
                title: page.title,
                description: page.description || "",
                route: page.route,
                status: page.status,
                meta: null // Meta will be fetched separately in MetaTagEditor
            });
        }
    }, [page]);

    const handleClose = useCallback(() => {
        if (saving) {
            enqueueSnackbar("Please wait for the save operation to complete.", { variant: "warning" });
            return;
        }
        onClose();
    }, [onClose, saving]);

    const handleSave = useCallback(async () => {
        if (!page.id) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/pages/${page.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }).then(res => res.json());

            if (!response.success) {
                throw new Error(response.message || "Failed to save page settings");
            }

            onSuccess?.(response.data);
            onClose();
        } catch (error: any) {
            enqueueSnackbar(error.message || "An unexpected error occurred", { variant: "error" });
        } finally {
            setSaving(false);
        }

    }, [data, page]);

    const handleChange = (field: keyof typeof data, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const cleanState = () => {
        setData(EMPTY_DATA);
        setShowAdvance(false);
    }

    return (
        <Dialog
            open={!!page}
            onClose={handleClose}
            slotProps={{
                transition: {
                    onExited: cleanState
                }
            }}
            maxWidth={showAdvance ? "lg" : "sm"}
            fullWidth >
            <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6">
                    Page Settings
                </Typography>
                <Button
                    size="small"
                    onClick={() => setShowAdvance(prev => !prev)}>
                    {showAdvance ? "Hide Advanced" : "Show Advanced"}
                </Button>
            </DialogTitle>
            <DialogContent sx={{ overflow: "visible" }}>
                <Grid container spacing={2}>
                    <Grid size={showAdvance ? 4 : 12}>
                        <TextField
                            disabled={saving}
                            label="Title"
                            value={data.title}
                            fullWidth
                            margin="normal"
                            onChange={(e) => handleChange("title", e.target.value)}
                        />
                        <TextField
                            disabled={saving}
                            label="Description"
                            value={data.description}
                            fullWidth
                            margin="normal"
                            rows={3}
                            multiline
                            onChange={(e) => handleChange("description", e.target.value)}
                        />
                        <TextField
                            disabled={saving}
                            label="Route"
                            fullWidth
                            margin="normal"
                            onChange={(e) => handleChange("route", e.target.value)}
                            value={data.route} />
                        <FormControlLabel
                            label={data.status === "active" ? "Active" : "Inactive"}
                            control={
                                <Switch
                                    disabled={saving}
                                    checked={data.status === "active"}
                                    onChange={(e) => handleChange("status", e.target.checked ? "active" : "inactive")}
                                />
                            } />
                        <FormHelperText>
                            {data.status === "active" ? "This page is currently active and accessible." : "This page is inactive and not accessible."}
                        </FormHelperText>
                    </Grid>
                    {showAdvance && (
                        <Grid size={8}>
                            <MetaTagEditor
                                disabled={saving}
                                pageId={page?.id}
                                onChange={v => handleChange("meta", v)} />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleSave}
                    color="primary"
                    loading={saving}
                    disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                    onClick={handleClose}
                    color="secondary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}