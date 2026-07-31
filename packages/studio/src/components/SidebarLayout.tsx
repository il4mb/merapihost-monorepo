"use client";

import { IconButton, Stack, Paper } from "@mui/material";
import { useState } from "react";
import { motion } from "motion/react";
import MenuIcon from "./icons/MenuIcon";
import SidebarContent from "./SidebarContent";

type SidebarLayoutProps = {
    children?: React.ReactNode;
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const [isOpen, setIsOpen] = useState(true);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <Stack direction="row" sx={{ height: '100vh', width: '100vw', position: 'relative' }}>
            {/* Sidebar */}
            <Stack
                component={motion.div}
                initial={{ width: 300 }}
                animate={{ width: isOpen ? 300 : 0 }}
                transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    opacity: { duration: 0.2 }
                }}
                sx={{
                    position: 'fixed',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    zIndex: 1300,
                    left: 0,
                    top: 0,
                }}>

                {/* Menu Toggle Button */}
                <IconButton
                    onClick={toggleSidebar}
                    component={motion.div}
                    initial={false}
                    animate={{ right: isOpen ? 8 : -40 }}
                    transition={{
                        duration: 0.5,
                        delay: isOpen ? 0 : 0.3,
                        ease: [0.4, 0, 0.2, 1],
                        scale: { duration: 0.3, delay: isOpen ? 0 : 0.4 }
                    }}
                    sx={{
                        position: 'absolute',
                        top: 12,
                        zIndex: 2,
                        border: 'none',
                        '&:hover': {
                            transform: 'scale(1.1)',
                        }
                    }}>
                    <MenuIcon open={isOpen} />
                </IconButton>

                {/* Sidebar Content */}
                <Stack
                    component={Paper}
                    elevation={0}
                    sx={{
                        overflow: 'hidden',
                        overflowY: 'auto',
                        height: '100%',
                        flex: 1,
                        borderRadius: 1,
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        boxShadow: isOpen ? 4 : 0,
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? 'auto' : 'none',
                        transition: 'box-shadow 0.3s ease',
                        bgcolor: 'background.paper',
                        position: 'relative',
                        py: 1, px: 1.5
                    }}>
                    <SidebarContent />
                </Stack>
            </Stack>

            {/* Main Content with Smooth Shift */}
            <Stack sx={{ flex: 1 }}>
                {children}
            </Stack>
        </Stack>
    );
}