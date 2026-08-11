"use client";
import { useStudio } from "@/contexts/StudioProvider";
import { useMemo, useRef, useCallback, useEffect } from "react";
import { useScreenContainer } from "./ScreenContainer";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

const FrameOfScreen = styled("div")({
    position: "absolute",
    top: "50%",
    left: "50%",
    transformOrigin: "center center",
    margin: "auto",
    border: "none",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    borderRadius: 8,
    overflow: "visible",
    pointerEvents: "none",
    "&:hover": {
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)"
    },
    msOverflowStyle: "none", // IE and Edge
    scrollbarWidth: "none", // Firefox
    "&::-webkit-scrollbar": {
        display: "none" // Chrome, Safari, Opera
    }
});

type ScreenFrameProps = {
    children?: React.ReactNode;
};

export default function ScreenFrame({ children }: ScreenFrameProps) {

    const { rect } = useScreenContainer();
    const { state, dispatch } = useStudio();
    const frameRef = useRef<HTMLDivElement>(null);

    const device = useMemo(() => state.devices.find(d => d.id === state.device), [state.devices, state.device]);
    const mediaLabel = useMemo(() => {
        if (!device) return "Unknown Device";
        if (device.width === "100%") return "Responsive";
        return `${device.name} (${device.width} x ${device.height || "auto"})`;
    }, [device]);

    const { width, height, scale } = useMemo(() => {
        if (!rect) {
            return { width: "calc(100% - 20px)", height: "calc(100% - 20px)", scale: 1 };
        }

        if (!device || device.width === "100%") {
            return { width: "calc(100% - 20px)", height: "calc(100% - 20px)", scale: 1 };
        }

        const targetWidth = Number(device.width);
        const targetHeight = device.height ? Number(device.height) : rect.height;

        const PADDING = 40;
        const availableWidth = rect.width - PADDING;
        const availableHeight = rect.height - PADDING;

        const scaleX = availableWidth / targetWidth;
        const scaleY = availableHeight / targetHeight;

        const calculatedScale = Math.min(1, Math.min(scaleX, scaleY));

        return {
            width: targetWidth,
            height: targetHeight,
            scale: calculatedScale
        }
    }, [device, rect]);


    const updateViewport = useCallback(() => {
        if (!frameRef.current) return;
        const rect = frameRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        dispatch({
            type: "UPDATE_VIEWPORT",
            payload: {
                width,
                height,
                scale // scale is important here, no other component can pass it to state, so we need to pass it here
            }
        });
    }, [dispatch, scale]);

    useEffect(() => {
        updateViewport();
    }, [updateViewport]);


    return (
        <FrameOfScreen
            ref={frameRef}
            sx={{
                width, height,
                transform: `translate(-50%, -50%) scale(${scale})`,
                transition: "opacity 0.3s ease, transform 0.3s ease",
                backgroundColor: "background.paper",
            }}>
            <Typography variant="caption" sx={{ position: "absolute", top: -22, left: 0, color: "rgb(202, 164, 121)", zIndex: 10 }}>
                {mediaLabel}
            </Typography>
            {children}
        </FrameOfScreen>
    );
}
