import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { Box, IconButton, styled, SxProps, Typography } from "@mui/material"
import { Maximize2, Minimize2, X } from "lucide-react"

// ----------------------------------------------------------------------
// Styled Components 
// ----------------------------------------------------------------------

const WindowButton = styled(IconButton)(({ theme }) => ({
    width: 26,
    height: 26,
    padding: 4,
    borderRadius: 6,
    transition: "background-color 0.2s",
    "&:hover": {
        backgroundColor: theme.palette.action.hover
    }
}))

const Container = styled(Box)(({ theme }) => ({
    position: "fixed",
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.15), 0px 4px 8px rgba(0, 0, 0, 0.05)",
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 1300,
    outline: 'none',
    ...theme.applyStyles("dark", {
        boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.6), inset 0px 1px 0px rgba(255,255,255,0.1)",
    })
}))

const Header = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "10px 16px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.mode === 'dark' ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
    userSelect: "none",
    touchAction: "none"
}))

const Body = styled(Box)({
    width: "100%",
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
})

const ResizeHandle = styled(Box)({
    position: "absolute",
    zIndex: 1301,
    touchAction: "none",
    backgroundColor: "transparent",
})

// ----------------------------------------------------------------------
// Constants & Types
// ----------------------------------------------------------------------

const MARGIN = 16
const MIN_WIDTH = 100
const MIN_HEIGHT = 180
const RESIZE_HANDLE_SIZE = 12

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

interface WindowDialogProps {
    title?: React.ReactNode
    width?: number
    height?: number
    resizable?: boolean
    movable?: boolean
    maximizable?: boolean
    autoGrowthLayout?: boolean | "vertical" | "horizontal"
    open?: boolean
    children?: React.ReactNode
    anchor?: React.RefObject<HTMLElement | null>
    anchorOrigin?: {
        vertical: "top" | "center" | "bottom"
        horizontal: "left" | "center" | "right"
    }
    anchorOffset?: {
        x?: number
        y?: number
    }
    sxProps?: {
        window?: SxProps
        header?: SxProps
        body?: SxProps
    }
    onInteractStart?: () => void
    onInteractEnd?: () => void
    onClose?: () => void
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function WindowDialog({
    title,
    width = 400,
    height = 400,
    resizable = false,
    movable = false,
    maximizable = false,
    autoGrowthLayout = false,
    open = false,
    children,
    anchor,
    anchorOrigin = { vertical: "top", horizontal: "left" },
    anchorOffset,
    sxProps,
    onInteractStart,
    onInteractEnd,
    onClose
}: WindowDialogProps) {

    const isCanClose = Boolean(onClose !== undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    // We only keep status UI flags in state now. 
    // This strictly prevents children re-rendering on mousemove.
    const [state, setState] = useState({
        maximized: false,
        isDragging: false,
        isResizing: false,
        resizeDirection: null as ResizeDirection | null,
        contextWidth: width,
        contextHeight: height,
        contextX: 0,
        contextY: 0
    })

    // Mutable Layout Ref (Bypasses React DOM diffing for instant updates)
    const layoutRef = useRef({
        x: 0, y: 0,
        width: width, height: height,
        lastX: 0, lastY: 0, lastWidth: width, lastHeight: height
    })

    // Tracking mouse geometry for interaction
    const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0, startWidth: 0, startHeight: 0 })

    const isAutoGrowthActive = !resizable && !!autoGrowthLayout;
    const isAutoSizingWidth = isAutoGrowthActive && (autoGrowthLayout === true || autoGrowthLayout === "horizontal") && !state.maximized;
    const isAutoSizingHeight = isAutoGrowthActive && (autoGrowthLayout === true || autoGrowthLayout === "vertical") && !state.maximized;

    // Initialize position relative to the end of the anchor element using live DOM dimensions
    const initializePosition = useCallback(() => {
        if (!containerRef.current) return;

        // Measure actual rendered DOM bounding box (includes header, styles, padding, theme)
        const rect = containerRef.current.getBoundingClientRect();
        const currentWidth = rect.width || layoutRef.current.width;
        const currentHeight = rect.height || layoutRef.current.height;

        layoutRef.current.width = currentWidth;
        layoutRef.current.height = currentHeight;

        let x = (window.innerWidth - currentWidth) / 2;
        let y = (window.innerHeight - currentHeight) / 2;

        if (anchorOffset && (anchorOffset.x !== undefined || anchorOffset.y !== undefined)) {
            if (anchorOffset.x !== undefined) x = anchorOffset.x;
            if (anchorOffset.y !== undefined) y = anchorOffset.y;
        } else if (anchor?.current) {
            const anchorRect = anchor.current.getBoundingClientRect();
            
            // Horizontal positioning relative to anchor bounds / end
            if (anchorOrigin.horizontal === "left") {
                x = anchorRect.left;
            } else if (anchorOrigin.horizontal === "right") {
                x = anchorRect.right;
            } else {
                x = anchorRect.left + (anchorRect.width / 2) - (currentWidth / 2);
            }

            // Vertical positioning relative to anchor bounds / end
            if (anchorOrigin.vertical === "top") {
                y = anchorRect.top;
            } else if (anchorOrigin.vertical === "bottom") {
                y = anchorRect.bottom;
            } else {
                y = anchorRect.top + (anchorRect.height / 2) - (currentHeight / 2);
            }
        } else {
            if (anchorOrigin.horizontal === "left") x = MARGIN;
            else if (anchorOrigin.horizontal === "right") x = window.innerWidth - currentWidth - MARGIN;
            if (anchorOrigin.vertical === "top") y = MARGIN;
            else if (anchorOrigin.vertical === "bottom") y = window.innerHeight - currentHeight - MARGIN;
        }

        layoutRef.current.x = Math.max(MARGIN, Math.min(x, window.innerWidth - currentWidth - MARGIN));
        layoutRef.current.y = Math.max(MARGIN, Math.min(y, window.innerHeight - currentHeight - MARGIN));

        containerRef.current.style.left = `${layoutRef.current.x}px`;
        containerRef.current.style.top = `${layoutRef.current.y}px`;

        setState(prev => ({
            ...prev,
            contextX: layoutRef.current.x,
            contextY: layoutRef.current.y,
            contextWidth: currentWidth,
            contextHeight: currentHeight
        }));
        setMounted(true);
    }, [anchor, anchorOrigin, anchorOffset]);

    // Single initialization effect
    useEffect(() => {
        if (!open) {
            setMounted(false);
            return;
        }
        if (!mounted) {
            requestAnimationFrame(initializePosition);
        }
    }, [open, mounted, initializePosition]);

    // Update dimensions when children change under auto-growth
    useEffect(() => {
        if (mounted && open && isAutoGrowthActive && !state.maximized && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const newWidth = rect.width;
            const newHeight = rect.height;

            if (newWidth !== layoutRef.current.width || newHeight !== layoutRef.current.height) {
                layoutRef.current.width = newWidth;
                layoutRef.current.height = newHeight;

                setState(prev => ({
                    ...prev,
                    contextWidth: newWidth,
                    contextHeight: newHeight
                }));
            }
        }
    }, [children, mounted, open, isAutoGrowthActive, state.maximized]);

    // Symmetric clamping helper functions
    const calcX = (x: number, w: number) => {
        const maxX = Math.max(MARGIN, window.innerWidth - w - MARGIN);
        return Math.min(Math.max(x, MARGIN), maxX);
    }

    const calcY = (y: number, h: number) => {
        const maxY = Math.max(MARGIN, window.innerHeight - h - MARGIN);
        return Math.min(Math.max(y, MARGIN), maxY);
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!movable || state.maximized || e.button !== 0) return

        dragStartRef.current = { 
            ...dragStartRef.current, 
            mouseX: e.clientX, 
            mouseY: e.clientY, 
            startX: layoutRef.current.x, 
            startY: layoutRef.current.y 
        };
        setState(prev => ({ ...prev, isDragging: true, isResizing: false, resizeDirection: null }))
        onInteractStart?.()
    }

    const startResize = (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()

        dragStartRef.current = {
            mouseX: e.clientX, mouseY: e.clientY,
            startX: layoutRef.current.x, startY: layoutRef.current.y,
            startWidth: layoutRef.current.width, startHeight: layoutRef.current.height
        };

        setState(prev => ({ ...prev, isDragging: false, isResizing: true, resizeDirection: direction }))
    }

    // Zero-rerender interaction loop
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { mouseX, mouseY, startX, startY, startWidth, startHeight } = dragStartRef.current;

            if (state.isDragging) {
                const w = containerRef.current.offsetWidth;
                const h = containerRef.current.offsetHeight;

                layoutRef.current.x = calcX(startX + (e.clientX - mouseX), w);
                layoutRef.current.y = calcY(startY + (e.clientY - mouseY), h);

                containerRef.current.style.left = `${layoutRef.current.x}px`;
                containerRef.current.style.top = `${layoutRef.current.y}px`;
            }

            if (state.isResizing && state.resizeDirection) {
                let nextX = startX, nextY = startY, nextWidth = startWidth, nextHeight = startHeight;
                const deltaX = e.clientX - mouseX;
                const deltaY = e.clientY - mouseY;

                if (state.resizeDirection.includes("e")) {
                    nextWidth = Math.max(MIN_WIDTH, Math.min(startWidth + deltaX, window.innerWidth - MARGIN - startX));
                }
                if (state.resizeDirection.includes("s")) {
                    nextHeight = Math.max(MIN_HEIGHT, Math.min(startHeight + deltaY, window.innerHeight - MARGIN - startY));
                }
                
                if (state.resizeDirection.includes("w")) {
                    const maxLeft = startX + startWidth - MIN_WIDTH;
                    nextX = Math.max(MARGIN, Math.min(startX + deltaX, maxLeft));
                    nextWidth = Math.max(MIN_WIDTH, startWidth - (nextX - startX));
                }
                
                if (state.resizeDirection.includes("n")) {
                    const maxTop = startY + startHeight - MIN_HEIGHT;
                    nextY = Math.max(MARGIN, Math.min(startY + deltaY, maxTop));
                    nextHeight = Math.max(MIN_HEIGHT, startHeight - (nextY - startY));
                }

                layoutRef.current.x = nextX;
                layoutRef.current.y = nextY;
                layoutRef.current.width = nextWidth;
                layoutRef.current.height = nextHeight;

                containerRef.current.style.left = `${nextX}px`;
                containerRef.current.style.top = `${nextY}px`;
                containerRef.current.style.width = `${nextWidth}px`;
                containerRef.current.style.height = `${nextHeight}px`;
            }
        }

        const handleMouseUp = () => {
            if (state.isDragging || state.isResizing) {
                setState(prev => ({
                    ...prev,
                    isDragging: false,
                    isResizing: false,
                    resizeDirection: null,
                    contextX: layoutRef.current.x,
                    contextY: layoutRef.current.y,
                    contextWidth: layoutRef.current.width,
                    contextHeight: layoutRef.current.height
                }))
                onInteractEnd?.()
            }
        }

        if (state.isDragging || state.isResizing) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
            }
        }
    }, [state.isDragging, state.isResizing, state.resizeDirection])

    const toggleMaximize = () => {
        if (!state.maximized) {
            layoutRef.current.lastX = layoutRef.current.x;
            layoutRef.current.lastY = layoutRef.current.y;
            layoutRef.current.lastWidth = layoutRef.current.width;
            layoutRef.current.lastHeight = layoutRef.current.height;
        } else {
            layoutRef.current.x = layoutRef.current.lastX;
            layoutRef.current.y = layoutRef.current.lastY;
            layoutRef.current.width = layoutRef.current.lastWidth;
            layoutRef.current.height = layoutRef.current.lastHeight;
        }
        setState(prev => ({ ...prev, maximized: !prev.maximized }))
    }

    if (!open) return null;

    const isInteracting = state.isDragging || state.isResizing;
    const resizeHandleStyles: Record<ResizeDirection, React.CSSProperties> = {
        n: { top: -RESIZE_HANDLE_SIZE / 2, left: RESIZE_HANDLE_SIZE, right: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: "ns-resize" },
        s: { bottom: -RESIZE_HANDLE_SIZE / 2, left: RESIZE_HANDLE_SIZE, right: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: "ns-resize" },
        e: { top: RESIZE_HANDLE_SIZE, bottom: RESIZE_HANDLE_SIZE, right: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE, cursor: "ew-resize" },
        w: { top: RESIZE_HANDLE_SIZE, bottom: RESIZE_HANDLE_SIZE, left: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE, cursor: "ew-resize" },
        ne: { top: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: "nesw-resize" },
        nw: { top: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: "nwse-resize" },
        se: { bottom: -RESIZE_HANDLE_SIZE / 2, right: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: "nwse-resize" },
        sw: { bottom: -RESIZE_HANDLE_SIZE / 2, left: -RESIZE_HANDLE_SIZE / 2, width: RESIZE_HANDLE_SIZE, height: RESIZE_HANDLE_SIZE, cursor: "nesw-resize" }
    }

    return (
        <WindowContext.Provider value={{
            width: state.contextWidth,
            height: state.contextHeight,
            x: state.contextX,
            y: state.contextY,
            maximized: state.maximized
        }}>
            {isInteracting && (
                <Box sx={{ 
                    position: "fixed", 
                    inset: 0, 
                    zIndex: 1299, 
                    cursor: state.isDragging ? "grabbing" : (state.resizeDirection ? resizeHandleStyles[state.resizeDirection].cursor : "auto"), 
                    userSelect: "none" 
                }} />
            )}

            <Container
                ref={containerRef}
                tabIndex={-1}
                style={{
                    width: state.maximized ? "100%" : (isAutoSizingWidth ? "fit-content" : `${layoutRef.current.width}px`),
                    height: state.maximized ? "100%" : (isAutoSizingHeight ? "fit-content" : `${layoutRef.current.height}px`),
                    top: state.maximized ? 0 : `${layoutRef.current.y}px`,
                    left: state.maximized ? 0 : `${layoutRef.current.x}px`,
                    minWidth: isAutoSizingWidth ? Math.max(width, MIN_WIDTH) : MIN_WIDTH,
                    minHeight: isAutoSizingHeight ? Math.max(height, MIN_HEIGHT) : MIN_HEIGHT,
                    borderRadius: state.maximized ? 0 : "10px",
                    opacity: mounted ? 1 : 0,
                    transition: isInteracting || !mounted ? "none" : "all 0.3s cubic-bezier(0.2, 0, 0, 1)",
                }}
                sx={sxProps?.window}>

                {!state.maximized && resizable && (Object.keys(resizeHandleStyles) as ResizeDirection[]).map(
                    direction => (
                        <ResizeHandle
                            key={direction}
                            onMouseDown={e => startResize(e, direction)}
                            sx={resizeHandleStyles[direction]}
                        />
                    )
                )}

                <Header
                    onMouseDown={handleMouseDown}
                    sx={{
                        cursor: movable && !state.maximized ? (state.isDragging ? "grabbing" : "grab") : "default",
                        ...sxProps?.header
                    }}
                    data-window-header>
                    <Typography component="div" variant="subtitle1" sx={{ fontWeight: "bold", userSelect: "none" }}>
                        {title}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                        {maximizable && (
                            <WindowButton onClick={e => { e.stopPropagation(); toggleMaximize(); }}>
                                {state.maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </WindowButton>
                        )}
                        {isCanClose && (
                            <WindowButton onClick={e => { e.stopPropagation(); onClose?.(); }}>
                                <X size={18} />
                            </WindowButton>
                        )}
                    </Box>
                </Header>

                <Body sx={sxProps?.body}>{children}</Body>
            </Container>
        </WindowContext.Provider>
    )
}

interface WindowState {
    width: number
    height: number
    x: number
    y: number
    maximized: boolean
}

const WindowContext = createContext<WindowState | null>(null)

export const useWindowContext = () => {
    const context = useContext(WindowContext)
    if (!context) throw new Error("useWindowContext must be used within a WindowDialog")
    return context
}