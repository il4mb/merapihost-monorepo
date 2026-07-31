"use client";
import { IconButton, Stack, Typography } from "@mui/material";
import { createContext, useContext, useState } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import SidebarContent from "./SidebarContent";

type SidebarLayoutProps = {
    children?: React.ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const [isOpen, setIsOpen] = useState(false);
    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
            <Stack direction="row" sx={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
                {/* Sidebar */}
                <Stack
                    component={motion.div}
                    initial={{ width: 0 }}
                    animate={{ width: isOpen ? 300 : 0 }}
                    sx={(theme) => ({
                        position: 'fixed',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        height: '100vh',
                        zIndex: 1300,
                        left: 0,
                        top: 0,
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: isOpen ? 4 : 0,
                        ...theme.applyStyles("dark", {
                            backgroundColor: theme.palette.background.paper,
                        })
                    })}>
                    <Stack
                        direction="row"
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 1,
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText'
                        }}>
                        <Typography variant="h6" sx={{ m: 0, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Studio Merapihost
                        </Typography>
                        <IconButton
                            onClick={toggleSidebar}
                            sx={{ color: 'inherit' }}
                            size="small">
                            <X size={20} />
                        </IconButton>
                    </Stack>
                    <SidebarContent />
                </Stack>
                <Stack sx={{ flex: 1 }}>
                    {children}
                </Stack>
            </Stack>
        </SidebarContext.Provider>
    );
}

interface SidebarContextType {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};