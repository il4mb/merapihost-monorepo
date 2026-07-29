"use client";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ReactNode } from 'react';

interface LocalizationAdapterProps {
    children?: ReactNode;
}

export default function LocalizationAdapter({ children }: LocalizationAdapterProps) {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            {children}
        </LocalizationProvider>
    );
}