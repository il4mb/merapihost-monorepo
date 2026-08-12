import { useState, useEffect, SyntheticEvent } from "react";
import { Box, CircularProgress } from "@mui/material";
import YoutubeIcon from "@/components/icons/YoutubeIcon";
import { createType } from "../tools";

// Helper to convert watch/short URLs into standard YouTube embed URLs
const getYoutubeEmbedUrl = (url: string = "") => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}`
        : url;
};

export const YoutubeType = createType(({ node, ref }) => {
    const rawSrc = node.props?.src;
    const [embedUrl, setEmbedUrl] = useState<string>(getYoutubeEmbedUrl(rawSrc));
    const [isLoading, setIsLoading] = useState<boolean>(!!rawSrc);

    useEffect(() => {
        const nextUrl = getYoutubeEmbedUrl(rawSrc);
        setEmbedUrl(nextUrl);
        setIsLoading(!!nextUrl);
    }, [rawSrc]);

    const handleLoad = (event: SyntheticEvent<HTMLIFrameElement, Event>) => {
        setIsLoading(false);
        if (typeof node.props?.onLoad === "function") {
            node.props.onLoad(event);
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
                component="iframe"
                {...node.props}
                src={embedUrl}
                onLoad={handleLoad}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                sx={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    display: "block",
                    pointerEvents: "none"
                }}
            />
        </Box>
    );
}, {
    name: "YouTube",
    icon: YoutubeIcon,
    accepts: [],
    isInstance(target) {
        if ("tagName" in target && String(target.tagName).toLowerCase() === "iframe") {
            const src = target.getAttribute?.("src") || "";
            return src.includes("youtube.com") || src.includes("youtu.be");
        }
        return false;
    },
    draggable: true,
    default: {
        name: "YouTube",
        tagName: "iframe",
        props: {
            src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            width: 560,
            height: 315,
            allowFullScreen: true,
        }
    }
});