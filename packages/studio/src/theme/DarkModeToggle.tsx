"use client";

import { useIsDark } from './index';
import { Box, IconButton, useColorScheme } from '@mui/material';
import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function DarkModeToggle() {
    const isDark = useIsDark();
    const { setMode } = useColorScheme();
    const toggelDarkMode = () => {
        setMode(isDark ? 'light' : 'dark');
    }
    return (
        <IconButton onClick={toggelDarkMode} color="inherit">
            <AnimatePresence mode="wait" initial={false}>
                <Box
                    component={motion.div}
                    key={isDark ? 'light-mode-icon' : 'dark-mode-icon'}
                    initial={{ opacity: 0, rotate: isDark ? -90 : 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: isDark ? 90 : -90 }}
                    transition={{ duration: 0.3 }}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isDark ? (
                        <Sun size={20} />
                    ) : (
                        <Moon size={20} />
                    )}
                </Box>
            </AnimatePresence>
        </IconButton>
    );
}