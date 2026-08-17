"use client";
import ScrollContainer from "@/components/ui/ScrollContainer";
import { usePages } from "@/contexts/PagesProvider";
import { motion } from "motion/react";
import { Typography, Divider, Box, LinearProgress, Stack, IconButton, Tooltip } from "@mui/material";
import { memo, useCallback, useEffect, useState, useMemo } from "react";
import type { PageObject } from "@/types";
import { FileIcon, FilePenIcon, FilePlusCorner, SettingsIcon } from "lucide-react";
import { useNavigate } from "@/hooks/useNavigate";
import { useParams } from "next/navigation";
import { useNavigation } from "@/components/navigations/NavigationProvider";
import PageSettingsDialog from "../dialogs/PageSettingsDialog";
import PageCreateDialog from "../dialogs/PageCreateDialog";
import { useStudio } from "@/contexts";

const ELLIPSIS_STYLE = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
}

type PageItemProps = {
    page: PageObject;
    onClick: () => void;
    onSettingsClick: () => void;
};
const PageItem = memo(({ page, onClick, onSettingsClick }: PageItemProps) => {

    const navigate = useNavigate();
    const { loading } = useNavigation();
    const { state } = useStudio();

    const isSelected = state.pages.selected?.id === page.id;
    const isOpened = state.pages.opened?.id === page.id;
    const IconComponent = isOpened ? FilePenIcon : FileIcon;

    const handleDoubleClick = useCallback((page: PageObject) => {
        navigate(`/dash/${page.id}`);
    }, [navigate]);

    return (
        <Tooltip title={!isOpened ? "Double click to open" : ""} arrow>
            <Box
                onClick={onClick}
                onDoubleClick={() => handleDoubleClick(page)}
                sx={{
                    display: "flex",
                    gap: 1, alignItems: "center",
                    mx: 1, px: 1, py: .25,
                    backgroundColor: isOpened ? "primary.main" : isSelected ? "action.selected" : "transparent",
                    color: isOpened ? "primary.contrastText" : "text.primary",
                    borderRadius: .25,
                    cursor: "pointer",
                    pointerEvents: loading ? "none" : "auto",
                    opacity: loading ? .5 : 1,
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
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSettingsClick();
                    }}>
                    <SettingsIcon size={16} />
                </IconButton>
            </Box>
        </Tooltip>
    );
});

export default function PagesManager() {
    const { dispatch } = useStudio();
    const { pageId } = useParams<{ pageId?: string }>();
    const { pages, loading, error } = usePages();
    const pagesArray = useMemo(() => Array.from(pages.values()), [pages]);
    const [editingPageSetting, setEditingPageSetting] = useState<PageObject | null>(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);

    const handleClick = useCallback((page: PageObject) => {
        dispatch({ type: "SET_SELECTED_PAGE", payload: page });
    }, [dispatch]);

    const handleAfterUpdatePage = useCallback((updatedPage: PageObject) => {
        dispatch({
            type: "UPDATE_PAGE",
            payload: {
                id: updatedPage.id,
                data: {
                    title: updatedPage.title,
                    description: updatedPage.description,
                    route: updatedPage.route,
                    status: updatedPage.status
                }
            }
        });
    }, [dispatch]);

    const handleAfterCreatePage = useCallback((newPage: PageObject) => {
        dispatch({
            type: "ADD_PAGE",
            payload: newPage
        });
    }, [dispatch]);

    useEffect(() => {
        if (pageId) {
            const page = pages.get(pageId);
            if (page) {
                dispatch({ type: "SET_OPENED_PAGE", payload: page });
            }
        }
    }, [pageId, pages, dispatch]);

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
                <Stack direction="row" sx={{ px: 1, py: .5, alignItems: "center", gap: .5, justifyContent: "space-between" }}>
                    <Typography
                        variant="overline"
                        sx={{ px: 1, display: "block", fontWeight: 600 }}>
                        Pages
                    </Typography>
                    <Tooltip title="Create New Page" arrow>
                        <IconButton
                            size="small"
                            onClick={() => setOpenCreateDialog(true)}>
                            <FilePlusCorner size={16} />
                        </IconButton>
                    </Tooltip>
                </Stack>
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
                    <PageItem
                        key={page.id}
                        page={page}
                        onClick={() => handleClick(page)}
                        onSettingsClick={() => setEditingPageSetting(page)}
                    />
                ))}
            </ScrollContainer>

            <PageCreateDialog
                open={openCreateDialog}
                onClose={() => setOpenCreateDialog(false)}
                onSuccess={handleAfterCreatePage}
            />

            <PageSettingsDialog
                page={editingPageSetting!}
                onClose={() => setEditingPageSetting(null)}
                onSuccess={handleAfterUpdatePage}
            />
        </Stack>
    );
}