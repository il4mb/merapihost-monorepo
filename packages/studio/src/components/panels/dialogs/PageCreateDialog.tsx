"use client";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, FormHelperText, Switch, TextField, Typography, Box, Stack } from "@mui/material";
import { PageObject } from "@/types";
import { useState, useEffect, useCallback, Fragment } from "react";
import MetaTagEditor from "@/components/ui/fields/MetaTagEditor";
import { enqueueSnackbar } from "notistack";
import { GlobeCheck, GlobeLock, GlobeOff } from "lucide-react";

const EMPTY_DATA = {
    title: "",
    description: "",
    route: "",
    status: "active" as "active" | "inactive"
}
type PageCreateDialogProps = {
    open: boolean;
    onClose: () => void;
    onSuccess?: (newPage: PageObject) => void;
};

export default function PageCreateDialog({ open, onClose, onSuccess }: PageCreateDialogProps) {
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(EMPTY_DATA);

    const handleChange = useCallback((field: keyof typeof data, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleCreate = useCallback(async () => {
        try {
            const response = await fetch(`/api/pages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }).then(res => res.json());

            if (!response.success) {
                throw new Error(response.message || "Failed to create page");
            }

            enqueueSnackbar("Page created successfully", { variant: "success" });
            onSuccess?.(response.data);
            handleClose();
        } catch (error: any) {
            enqueueSnackbar(error.message || "An unexpected error occurred", { variant: "error" });
        }
    }, [data, onSuccess, handleClose]);

    const cleanUp = useCallback(() => {
        setData(EMPTY_DATA);
        setSaving(false);
    }, []);

    useEffect(() => {
        if (!open) {
            setData(EMPTY_DATA);
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            slotProps={{
                transition: {
                    onExited: cleanUp
                }
            }}
            fullWidth>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogContent sx={{ overflow: "visible" }}>
                <Stack spacing={2}>
                    <TextField
                        label="Title"
                        fullWidth
                        value={data.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={data.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                    />
                    <TextField
                        label="Route"
                        fullWidth
                        value={data.route}
                        onChange={(e) => handleChange("route", e.target.value)}
                    />
                    <Box>
                        <FormControlLabel
                            label={data.status === "active" ? "Active" : "Inactive"}
                            control={
                                <Switch
                                    disabled={saving}
                                    checked={data.status === "active"}
                                    onChange={(e) => handleChange("status", e.target.checked ? "active" : "inactive")}
                                />
                            } />
                        <FormHelperText sx={{ 
                            color: data.status === "active" ? "success.main" : "error.main",
                        }}>
                            {data.status === "active" ? (
                                <Fragment>
                                    <GlobeCheck size={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                                    Page is active and accessible.
                                </Fragment>
                            ) : (
                                <Fragment>
                                    <GlobeLock size={16} style={{ verticalAlign: "middle", marginRight: 4 }} />
                                    Page is inactive and not accessible.
                                </Fragment>
                            )}
                        </FormHelperText>
                    </Box>
                </Stack>

            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreate} variant="contained" color="primary">Create</Button>
            </DialogActions>
        </Dialog>
    );
}
