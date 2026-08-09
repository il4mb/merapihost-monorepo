"use client";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField, Typography, Box } from "@mui/material";
import { PageObject } from "@/types";
import { useState, useEffect, useCallback } from "react";
import CodeMirror, { ViewUpdate } from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { useIsDark } from "@/theme";
import MetaTagEditor from "@/components/ui/fields/MetaTagEditor";

const EMPTY_DATA = {
    title: "",
    description: "",
    route: "",
    meta: ""
}

type PageSettingsDialogProps = {
    page: PageObject | null;
    onClose: () => void;
};

export default function PageSettingsDialog({ page, onClose }: PageSettingsDialogProps) {
    const isDark = useIsDark();
    const [showAdvance, setShowAdvance] = useState(true);
    const [data, setData] = useState(EMPTY_DATA);

    useEffect(() => {
        if (page) {
            setData({
                title: page.title,
                description: page.description || "",
                route: page.route,
                meta: String(page.meta || "")
            });
        }
    }, [page]);

    const handleChange = (field: keyof typeof data, value: string) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const handleMetaChange = useCallback((val: string, viewUpdate: ViewUpdate) => {
        setData(prev => ({ ...prev, meta: val }));
    }, []);

    const cleanState = () => {
        setData(EMPTY_DATA);
    }

    return (
        <Dialog
            open={!!page}
            onClose={onClose}
            slotProps={{
                transition: {
                    onExited: cleanState
                }
            }}
            maxWidth={showAdvance ? "md" : "sm"}
            fullWidth>
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
                    <Grid size={showAdvance ? 6 : 12}>
                        <TextField
                            label="Title"
                            value={data.title}
                            fullWidth
                            margin="normal"
                            onChange={(e) => handleChange("title", e.target.value)}
                        />
                        <TextField
                            label="Description"
                            value={data.description}
                            fullWidth
                            margin="normal"
                            rows={3}
                            multiline
                            onChange={(e) => handleChange("description", e.target.value)}
                        />
                        <TextField
                            label="Route"
                            fullWidth
                            margin="normal"
                            onChange={(e) => handleChange("route", e.target.value)}
                            value={data.route} />
                        <Typography variant="body2" color="textSecondary">
                            Status: {page?.status || "N/A"}
                        </Typography>
                    </Grid>
                    {showAdvance && (
                        <Grid size={6}>
                            <MetaTagEditor pageId={page?.id} />
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { }} color="primary">
                    Save
                </Button>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}