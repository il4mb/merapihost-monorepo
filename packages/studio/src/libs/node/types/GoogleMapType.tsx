import { useState, useEffect, SyntheticEvent } from "react";
import { Box, CircularProgress } from "@mui/material";
import { MapPin as MapIcon } from "lucide-react";
import { createType } from "@/libs/node/createType";

// Helper to handle full embed URLs or convert plain query strings (address, landmark) to embed URLs
const getGoogleMapEmbedUrl = (urlOrQuery: string = "") => {
    if (!urlOrQuery) return "";

    // If already a valid embed URL, return as is
    if (urlOrQuery.includes("/maps/embed") || urlOrQuery.includes("output=embed")) {
        return urlOrQuery;
    }

    // Convert plain location/address string to free embed search URL
    return `https://maps.google.com/maps?q=${encodeURIComponent(urlOrQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
};

export const GoogleMapType = createType(({ node, ref }) => {
    const rawSrc = node.props?.src;
    const [embedUrl, setEmbedUrl] = useState<string>(getGoogleMapEmbedUrl(rawSrc));
    const [isLoading, setIsLoading] = useState<boolean>(!!rawSrc);

    useEffect(() => {
        const nextUrl = getGoogleMapEmbedUrl(rawSrc);
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
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                sx={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    display: "block",
                    pointerEvents: node.data.isSelected ? "auto" : "none"
                }}
            />
        </Box>
    );
}, {
    name: "GoogleMap",
    icon: MapIcon,
    isInstance(target) {
        if ("tagName" in target && String(target.tagName).toLowerCase() === "iframe") {
            const src = target.props?.src || "";
            return src.includes("google.com/maps") || src.includes("maps.google.com");
        }
        return false;
    },
    draggable: true,
    accepts: [],
    default: {
        name: "Google Map",
        tagName: "iframe",
        props: {
            src: "Monas, Jakarta",
            width: 600,
            height: 450,
            allowFullScreen: true,
            loading: "lazy",
        }
    }
});