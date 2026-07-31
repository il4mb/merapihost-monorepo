"use client";
import { SnackbarProvider as NotistackProvider, closeSnackbar, SnackbarKey } from "notistack";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { memo } from "react";

interface SnackbarProviderProps {
    children: React.ReactNode;
}

export default function SnackbarProvider({ children }: SnackbarProviderProps) {
    return (
        <NotistackProvider
            maxSnack={3}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            autoHideDuration={3000}
            action={(snackbarId) => <CloseAction snackbarId={snackbarId} />}>
            {children}
        </NotistackProvider>
    );
}

const CloseAction = memo(function CloseAction({ snackbarId }: { snackbarId: SnackbarKey; }) {
    return (
        <IconButton color="inherit" size="small" onClick={() => closeSnackbar(snackbarId)}>
            <CloseIcon fontSize="small" />
        </IconButton>
    );
});