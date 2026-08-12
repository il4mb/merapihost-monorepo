import { useState, useEffect, SyntheticEvent } from "react";
import { Box, CircularProgress } from "@mui/material";
import { Video as VideoIcon } from "lucide-react";
import { createType } from "../tools";

export const VideoType = createType(({ node, ref }) => {
    const rawSrc = node.props?.src;
    const [videoSrc, setVideoSrc] = useState<string>(rawSrc || "");
    const [isLoading, setIsLoading] = useState<boolean>(!!rawSrc);

    useEffect(() => {
        const nextSrc = rawSrc || "";
        setVideoSrc(nextSrc);
        // Show loader whenever a new video URL is passed
        setIsLoading(!!rawSrc);
    }, [rawSrc]);

    const handleLoadedData = (event: SyntheticEvent<HTMLVideoElement, Event>) => {
        setIsLoading(false);
        if (typeof node.props?.onLoadedData === "function") {
            node.props.onLoadedData(event);
        }
    };

    const handleError = (event: SyntheticEvent<HTMLVideoElement, Event>) => {
        setIsLoading(false);
        if (typeof node.props?.onError === "function") {
            node.props.onError(event);
        }
    };

    const width = node.props?.width || "100%";
    const height = node.props?.height || "100%";

    return (
        <Box
            sx={{
                position: "relative",
                display: "inline-block",
                width,
                height,
                ...node.props?.sx,
            }}
            ref={ref}>
            {isLoading && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(240, 240, 240, 0.5)",
                        zIndex: 1,
                    }}>
                    <CircularProgress size={24} />
                </Box>
            )}
            <Box
                component="video"
                controls
                {...node.props}
                src={videoSrc}
                onLoadedData={handleLoadedData}
                onError={handleError}
                sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: node.props?.objectFit || "cover",
                    display: "block",
                    pointerEvents: "none"
                }}
            />
        </Box>
    );
}, {
    name: "Video",
    icon: VideoIcon,
    accepts: [],

    isInstance(target) {
        if ("tagName" in target && String(target.tagName).toLowerCase() === "video") {
            return true;
        }
        return false;
    },
    draggable: true,
    default: {
        name: "Video",
        tagName: "video",
        props: {
            src: "",
            controls: true,
            width: 320,
            height: 180,
        }
    }
});