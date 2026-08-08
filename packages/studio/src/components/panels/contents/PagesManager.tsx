"use client";
import ScrollContainer from "@/components/ui/ScrollContainer";
import { usePages } from "@/contexts/PagesProvider";
import { motion } from "motion/react";
import { Typography, Divider, Box, LinearProgress, Stack, IconButton } from "@mui/material";
import { memo, useCallback } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import type { PageObject } from "@/types";
import { FileIcon, FilePenIcon, SettingsIcon } from "lucide-react";

const ELLIPSIS_STYLE = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
}

const PageItem = memo(({ page }: { page: PageObject }) => {
    const { state, dispatch } = useStudio();
    const isSelected = state.pages.selected?.id === page.id;
    const isOpened = state.pages.opened?.id === page.id;
    const IconComponent = isOpened ? FilePenIcon : FileIcon;

    const handleClick = useCallback((page: PageObject) => {
        dispatch({ type: "SET_SELECTED_PAGE", payload: page });
    }, [dispatch]);

    const handleDoubleClick = useCallback((page: PageObject) => {
        dispatch({ type: "SET_OPENED_PAGE", payload: page });
    }, [dispatch]);

    return (
        <Box
            onClick={() => handleClick(page)}
            onDoubleClick={() => handleDoubleClick(page)}
            sx={{
                display: "flex",
                gap: 1, alignItems: "center",
                mx: 1, px: 1, py: .25,
                backgroundColor: isOpened ? "primary.main" : isSelected ? "action.selected" : "transparent",
                color: isOpened ? "primary.contrastText" : "text.primary",
                borderRadius: .25,
                cursor: "pointer",
                "--action-visibility": isOpened ? "visible" : "hidden",
                "&:hover": {
                    backgroundColor: isOpened ? "primary.dark" : isSelected ? "action.selected" : "action.hover",
                    "--action-visibility": "visible"
                },
            }}>
            <Box component={IconComponent} size={16} />
            <Box>
                <Typography
                    sx={{
                        fontWeight: 500,
                        fontSize: 12,
                        userSelect: "none",
                        ...ELLIPSIS_STYLE
                    }}>
                    {page.title}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        opacity: .7,
                        fontSize: 10,
                        mt: "-3px",
                        userSelect: "none",
                        ...ELLIPSIS_STYLE
                    }}>
                    {page.route}
                </Typography>
            </Box>
            <IconButton
                size="small"
                sx={{
                    ml: "auto", p: 0, transition: "none",
                    visibility: "var(--action-visibility)",
                    color: isOpened ? "primary.contrastText" : "text.secondary",
                }}>
                <SettingsIcon size={16} />
            </IconButton>
        </Box>
    );
});

PageItem.displayName = "PageItem";

export default function PagesManager() {
    const { pages, loading, error } = usePages();
    const pagesArray = Array.from(pages.values());

    if (error) {
        return (
            <Stack sx={{ p: 2, alignItems: "center", justifyContent: "center", flex: 1 }}>
                <Typography color="error" variant="body2">
                    Error loading pages: {error}
                </Typography>
            </Stack>
        );
    }

    return (
        <Stack
            component={motion.div}
            layout
            direction="column"
            sx={{ overflow: "hidden", flex: 1 }}>
            <Box sx={{ position: 'relative' }}>
                <Typography
                    variant="overline"
                    sx={{ px: 1, display: "block", fontWeight: 600 }}>
                    Pages
                </Typography>
                <Divider />
                <LinearProgress
                    sx={{
                        height: 2,
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        opacity: loading ? 1 : 0,
                        transition: "opacity 0.3s ease",
                    }}
                />
            </Box>
            <ScrollContainer sx={{ pt: 1, gap: .25 }}>
                {pagesArray.map(page => (
                    <PageItem key={page.id} page={page} />
                ))}
            </ScrollContainer>
        </Stack>
    );
}