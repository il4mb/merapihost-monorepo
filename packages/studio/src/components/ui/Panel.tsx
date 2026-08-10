"use client";
import { Box, BoxProps, styled } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const PanelContainer = styled(Box)({
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
});

type PanelProps = BoxProps & {
    position?: 'left' | 'right';
    initialWidth?: number;
    maxWidth?: number;
    minWidth?: number;
    resizeable?: boolean;
    slotProps?: {
        content?: BoxProps;
    }
}

export default function Panel(props: PanelProps) {
    const { children, position = "left", initialWidth = 250, maxWidth = 600, minWidth = 100, resizeable = false, slotProps, ...boxProps } = props;
    const isLeftToRight = position === 'left';

    const [width, setWidth] = useState(initialWidth);
    const [isDragging, setIsDragging] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (event: React.MouseEvent) => {
        setIsDragging(true);
        event.preventDefault();
    };

    useEffect(() => {
        if (!resizeable) return;
        const handleMouseMove = (event: MouseEvent) => {
            if (!panelRef.current) return;

            const newWidth = isLeftToRight
                ? event.clientX - panelRef.current.getBoundingClientRect().left
                : panelRef.current.getBoundingClientRect().right - event.clientX;

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isLeftToRight, minWidth, maxWidth, resizeable]);

    return (
        <PanelContainer
            {...boxProps}
            ref={panelRef}
            sx={{ width: `${width}px`, flexShrink: 0, ...boxProps.sx }}>
            <Box
                {...slotProps?.content}
                sx={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    ...slotProps?.content?.sx
                }}>
                {children}
            </Box>
            {resizeable && (
                <Box
                    onMouseDown={handleMouseDown}
                    sx={{
                        width: '8px',
                        height: '100%',
                        cursor: 'col-resize',
                        position: 'absolute',
                        top: 0, borderRadius: .25,
                        left: isLeftToRight ? 'auto' : -4,
                        right: isLeftToRight ? -4 : 'auto',
                        zIndex: 1000,
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.2s',
                        opacity: 0,
                        "&:hover, &:active": {
                            backgroundColor: 'primary.main',
                            opacity: 0.15
                        },
                        ...(isDragging && {
                            backgroundColor: 'primary.main',
                            opacity: 0.25
                        })
                    }}
                />
            )}

            {isDragging && (
                // Overlay to capture mouse events during drag
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        cursor: 'col-resize',
                        zIndex: 9999,
                        backgroundColor: 'transparent'
                    }}
                />
            )}


        </PanelContainer>
    );
}