import { Box, IconButton, styled, SxProps, Typography } from "@mui/material"
import { Maximize2, X } from "lucide-react"
import React, { createContext, useContext, useEffect, useRef, useState } from "react"

const Button = styled(IconButton)({
    width: 22,
    height: 22,
    padding: 0
})

const Container = styled("div")(({ theme }) => ({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgb(255, 255, 255)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1000,
    ...theme.applyStyles("dark", {
        backgroundColor: "rgb(18, 18, 18)",
        color: "#fff",
        boxShadow:
            "4px 4px 0px 0px rgb(207, 212, 228), 0 4px 12px rgba(0, 0, 0, 0.5)"
    })
}))

const Body = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
})

const Header = styled("div")({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 12px"
})

const ResizeHandle = styled("div")({
    position: "absolute",
    zIndex: 1001,
    touchAction: "none"
})

const MARGIN = 10
const MIN_WIDTH = 280
const MIN_HEIGHT = 220
const RESIZE_HANDLE_SIZE = 10

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"

interface WindowDialogProps {
    title?: React.ReactNode
    width?: number
    height?: number
    resizable?: boolean
    movable?: boolean
    maximizable?: boolean
    open?: boolean
    children?: React.ReactNode
    anchor?: React.RefObject<HTMLElement | null>
    ancorOrigin?: {
        vertical: "top" | "center" | "bottom"
        horizontal: "left" | "center" | "right"
    }
    ancorOffset?: {
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

export default function WindowDialog({
    title,
    width,
    height,
    resizable = false,
    movable = false,
    maximizable = false,
    open = false,
    children,
    anchor,
    ancorOrigin = { vertical: "top", horizontal: "left" },
    ancorOffset,
    sxProps,
    onInteractStart,
    onInteractEnd,
    onClose
}: WindowDialogProps) {

    const containerRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [state, setState] = useState({
        maximized: false,
        width: width || 400,
        height: height || 400,
        x: 0,
        y: 0,
        lastData: {
            x: 0,
            y: 0,
            width: width || 400,
            height: height || 400
        },
        isDragging: false,
        isResizing: false,
        resizeDirection: null as ResizeDirection | null
    })

    const initialPositionRef = useRef({ x: 0, y: 0 })
    const resizeStartRef = useRef({
        x: 0,
        y: 0,
        width: width || 400,
        height: height || 400,
        left: 0,
        top: 0
    })

    // Reset mounted state when closed so it recalculates position when reopened
    useEffect(() => {
        if (!open) {
            setMounted(false)
        }
    }, [open])

    useEffect(() => {
        if (open && containerRef.current && !mounted) {
            const minX = MARGIN
            const maxX = window.innerWidth - (state.width + MARGIN)
            const minY = MARGIN
            const maxY = window.innerHeight - (state.height + MARGIN)
            const rect = containerRef.current.getBoundingClientRect()
            const width = rect.width;
            const height = rect.height;

            let x = (window.innerWidth - width) / 2
            let y = (window.innerHeight - height) / 2

            if (anchor?.current) {
                // Calculate position relative to the anchor
                const anchorRect = anchor.current.getBoundingClientRect()

                // Horizontal anchor logic
                if (ancorOrigin.horizontal === "left") {
                    x = anchorRect.left - width - (ancorOffset?.x || 0) // Typically opens to the left of the anchor
                } else if (ancorOrigin.horizontal === "right") {
                    x = anchorRect.right - width + (ancorOffset?.x || 0) // Opens to the right of the anchor
                } else {
                    x = anchorRect.left + (anchorRect.width / 2) - (width / 2)
                }

                // Vertical anchor logic
                if (ancorOrigin.vertical === "top") {
                    y = anchorRect.bottom + (ancorOffset?.y || 0) // Typically opens below the anchor
                } else if (ancorOrigin.vertical === "bottom") {
                    y = anchorRect.top - height - (ancorOffset?.y || 0) // Opens above the anchor
                } else {
                    y = anchorRect.top + (anchorRect.height / 2) - (height / 2)
                }
            } else {
                // Calculate position relative to the screen (fallback)
                if (ancorOrigin.horizontal === "left") {
                    x = MARGIN
                } else if (ancorOrigin.horizontal === "right") {
                    x = window.innerWidth - width - MARGIN
                }

                if (ancorOrigin.vertical === "top") {
                    y = MARGIN
                } else if (ancorOrigin.vertical === "bottom") {
                    y = window.innerHeight - height - MARGIN
                }
            }

            setState(prev => ({
                ...prev,
                height: height,
                width: width,
                x: Math.min(Math.max(x, minX), maxX),
                y: Math.min(Math.max(y, minY), maxY)
            }))
            setMounted(true)
        }
    }, [open, containerRef.current, height, mounted, ancorOrigin.horizontal, ancorOrigin.vertical, anchor?.current])

    const calcX = (x: number) => {
        const minX = MARGIN
        const maxX = window.innerWidth - (state.width + MARGIN)
        if (x < minX) return minX
        if (x > maxX) {
            const overflow = x - maxX
            return maxX + overflow * 0.2
        }
        return x
    }

    const calcY = (y: number) => {
        const minY = MARGIN
        const maxY = window.innerHeight - (state.height + MARGIN)
        if (y < minY) return minY
        if (y > maxY) {
            const overflow = y - maxY
            return maxY + overflow * 0.2
        }
        return y
    }

    const toggleMaximize = () => {
        setState(prev => ({
            ...prev,
            maximized: !prev.maximized,
            ...(!prev.maximized
                ? {
                    lastData: {
                        x: prev.x,
                        y: prev.y,
                        width: prev.width,
                        height: prev.height
                    },
                    x: 0,
                    y: 0,
                    width: window.innerWidth,
                    height: window.innerHeight
                }
                : {
                    x: prev.lastData.x,
                    y: prev.lastData.y,
                    width: prev.lastData.width,
                    height: prev.lastData.height
                })
        }))
    }

    const blockInteractionTimeoutRef = useRef<number>(null);
    const blockInteraction = () => {
        if (blockInteractionTimeoutRef.current) {
            clearTimeout(blockInteractionTimeoutRef.current);
        }
        blockInteractionTimeoutRef.current = setTimeout(() => {
            document.body.style.userSelect = "none"
            document.body.style.cursor = "grabbing"
            document.body.style.pointerEvents = "none"
            document.querySelectorAll("iframe").forEach(iframe => {
                (iframe as HTMLIFrameElement).style.pointerEvents = "none"
            })
        }, 200); // Delay to prevent blocking interactions on the initial click
    }

    const unblockInteraction = () => {
        if (blockInteractionTimeoutRef.current) {
            clearTimeout(blockInteractionTimeoutRef.current);
            blockInteractionTimeoutRef.current = null;
        }
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        document.body.style.pointerEvents = ""
        document.querySelectorAll("iframe").forEach(iframe => {
            (iframe as HTMLIFrameElement).style.pointerEvents = ""
        })
    }


    const handleMouseDown = (e: React.MouseEvent) => {
        if (!movable || state.maximized || e.button !== 0) return

        initialPositionRef.current = { x: e.clientX, y: e.clientY }
        setState(prev => ({
            ...prev,
            isDragging: true,
            isResizing: false,
            resizeDirection: null,
            maximized: false,
            ...(!prev.maximized
                ? {
                    lastData: {
                        x: prev.x,
                        y: prev.y,
                        width: prev.width,
                        height: prev.height
                    }
                }
                : {
                    x: prev.lastData.x,
                    y: prev.lastData.y,
                    width: prev.lastData.width,
                    height: prev.lastData.height
                })
        }))
        onInteractStart?.()
        blockInteraction();
    }

    const startResize = (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
        if (e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: state.width,
            height: state.height,
            left: state.x,
            top: state.y
        }
        setState(prev => ({
            ...prev,
            isDragging: false,
            isResizing: true,
            resizeDirection: direction,
            maximized: false,
            lastData: {
                x: prev.x,
                y: prev.y,
                width: prev.width,
                height: prev.height
            }
        }))
        blockInteraction();
    }

    const handleMouseMove = (e: MouseEvent) => {
        if (!state.isDragging) return
        const deltaX = e.clientX - initialPositionRef.current.x
        const deltaY = e.clientY - initialPositionRef.current.y
        setState(prev => ({
            ...prev,
            x: calcX(prev.x + deltaX),
            y: calcY(prev.y + deltaY)
        }))
        initialPositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
        setState(prev => ({
            ...prev,
            isDragging: false,
            isResizing: false,
            resizeDirection: null
        }))
        onInteractEnd?.()
        initialPositionRef.current = { x: 0, y: 0 }
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        document.body.style.pointerEvents = ""
        document.querySelectorAll("iframe").forEach(iframe => {
            (iframe as HTMLIFrameElement).style.pointerEvents = ""
        })
        unblockInteraction();
    }

    const handleResizeMove = (e: MouseEvent) => {
        if (!state.isResizing || !state.resizeDirection) return

        const { x, y, width, height, left, top } = resizeStartRef.current
        const deltaX = e.clientX - x
        const deltaY = e.clientY - y
        const maxRight = window.innerWidth - MARGIN
        const maxBottom = window.innerHeight - MARGIN

        let nextX = left
        let nextY = top
        let nextWidth = width
        let nextHeight = height

        if (state.resizeDirection.includes("e")) {
            nextWidth = Math.max(
                MIN_WIDTH,
                Math.min(width + deltaX, maxRight - left)
            )
        }
        if (state.resizeDirection.includes("s")) {
            nextHeight = Math.max(
                MIN_HEIGHT,
                Math.min(height + deltaY, maxBottom - top)
            )
        }
        if (state.resizeDirection.includes("w")) {
            const maxLeft = left + width - MIN_WIDTH
            nextX = Math.max(MARGIN, Math.min(left + deltaX, maxLeft))
            nextWidth = Math.max(MIN_WIDTH, width - (nextX - left))
        }
        if (state.resizeDirection.includes("n")) {
            const maxTop = top + height - MIN_HEIGHT
            nextY = Math.max(MARGIN, Math.min(top + deltaY, maxTop))
            nextHeight = Math.max(MIN_HEIGHT, height - (nextY - top))
        }

        setState(prev => ({
            ...prev,
            x: nextX,
            y: nextY,
            width: nextWidth,
            height: nextHeight
        }))
    }

    useEffect(() => {
        if (state.isDragging || state.isResizing) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mousemove", handleResizeMove)
            window.addEventListener("mouseup", handleMouseUp)

            return () => {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mousemove", handleResizeMove)
                window.removeEventListener("mouseup", handleMouseUp)
            }
        }

        return () => { }
    }, [state.isDragging, state.isResizing, state.resizeDirection])

    const resizeHandleStyles: Record<ResizeDirection, React.CSSProperties> = {
        n: {
            top: -RESIZE_HANDLE_SIZE / 2,
            left: RESIZE_HANDLE_SIZE,
            right: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
            cursor: "ns-resize"
        },
        s: {
            bottom: -RESIZE_HANDLE_SIZE / 2,
            left: RESIZE_HANDLE_SIZE,
            right: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
            cursor: "ns-resize"
        },
        e: {
            top: RESIZE_HANDLE_SIZE,
            bottom: RESIZE_HANDLE_SIZE,
            right: -RESIZE_HANDLE_SIZE / 2,
            width: RESIZE_HANDLE_SIZE,
            cursor: "ew-resize"
        },
        w: {
            top: RESIZE_HANDLE_SIZE,
            bottom: RESIZE_HANDLE_SIZE,
            left: -RESIZE_HANDLE_SIZE / 2,
            width: RESIZE_HANDLE_SIZE,
            cursor: "ew-resize"
        },
        ne: {
            top: -RESIZE_HANDLE_SIZE / 2,
            right: -RESIZE_HANDLE_SIZE / 2,
            width: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
            cursor: "nesw-resize"
        },
        nw: {
            top: -RESIZE_HANDLE_SIZE / 2,
            left: -RESIZE_HANDLE_SIZE / 2,
            width: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
            cursor: "nwse-resize"
        },
        se: {
            bottom: -RESIZE_HANDLE_SIZE / 2,
            right: -RESIZE_HANDLE_SIZE / 2,
            width: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
            cursor: "nwse-resize"
        },
        sw: {
            bottom: -RESIZE_HANDLE_SIZE / 2,
            left: -RESIZE_HANDLE_SIZE / 2,
            width: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
            cursor: "nesw-resize"
        }
    }

    if (!open) return null;

    return (
        <WindowContext.Provider value={state}>
            <Container
                ref={containerRef}
                sx={{
                    opacity: mounted ? 1 : 0,
                    width: state.maximized ? "100%" : state.width,
                    height: state.maximized ? "100%" : state.height,
                    top: state.y,
                    left: state.x,
                    cursor: state.isDragging ? "grabbing" : "default",
                    userSelect: state.isDragging || state.isResizing ? "none" : "auto",
                    ...sxProps?.window
                }}>
                {!state.maximized &&
                    resizable &&
                    (Object.keys(resizeHandleStyles) as ResizeDirection[]).map(
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
                        cursor: movable && !state.maximized
                            ? (state.isDragging ? "grabbing" : "grab")
                            : "default",
                        ...sxProps?.header
                    }}>
                    <Typography component={"div"} variant="h6">{title}</Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        {maximizable && (
                            <Button
                                onClick={e => {
                                    e.stopPropagation()
                                    toggleMaximize()
                                }}>
                                <Maximize2 size={12} />
                            </Button>
                        )}
                        <Button onClick={e => { e.stopPropagation(); onClose?.(); }}>
                            <X size={14} />
                        </Button>
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
    if (!context) {
        throw new Error("useWindowContext must be used within a WindowDialog")
    }
    return context
}