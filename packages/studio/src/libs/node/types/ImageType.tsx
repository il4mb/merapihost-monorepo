import { useState, useEffect, SyntheticEvent } from "react";
import { Box, CircularProgress } from "@mui/material";
import { ImageIcon } from "lucide-react";
import { createType } from "@/libs/node/createType";

const EMPTY_IMAGE = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwcHgiIGhlaWdodD0iNDAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAyMkgyMUMyMS41NTIzIDIyIDIyIDIxLjU1MjMgMjIgMjFWMTdMMTcuNzA3MSAxMi43MDcxQzE3LjMxNjYgMTIuMzE2NiAxNi42ODM0IDEyLjMxNjYgMTYuMjkyOSAxMi43MDcxTDEwLjUgMTguNUMxMC4yMjM5IDE4Ljc3NjEgOS43NzYxNCAxOC43NzYxIDkuNSAxOC41QzkuMjIzphonMTguMjIzOSA5LjIyMzg2IDE3Ljc3NjEgOS41IDE3LjVMMTEgMTZMOC43MDcxMSAxMy43MDcxQzguMzE2NTggMTMuMzE2NiA3LjY4MzQyECAxMy4zE242ADNy4yOTI4OSAxMy43MDcxTDIgMTlWMjFDMiAyMS41NTIzIDIuNDQ3NzIgMjIgMyAyMlpNMjEgMjRIM0MxLjM0MzE1IDI4IDAgMjIuNjU2OSAwIDIxVjNDMCAxLjM0MzE1IDEuMzQ3MTUgMCAzIDBIMjFDMjIuNjU2OSAwIDI0IDEuMzQzMTUgMjQgM1YyMUMyNCAyMi42NTY5IDIyLjY1NjkgMjQgMjEgMjRaTTYuNSA5QzcuODgwNzEgOSA5IDcuODgwNzEgOSA2LjVDOSA1LjExOTI5IDcuODgwNzEgNCA2LjUgNEM1LjExOTI5IDQgNCA1LjExOTI5IDQgNi41QzQgNy44ODA3MSA1LjExOTI5IDkgNi41IDlaIiBmaWxsPSIjNzU4Q0EzIi8+PC9zdmc+";

export const ImageType = createType(({ node, ref }) => {
    const rawSrc = node.props?.src;
    const [imgSrc, setImgSrc] = useState<string>(rawSrc || EMPTY_IMAGE);
    const [isLoading, setIsLoading] = useState<boolean>(!!rawSrc && rawSrc !== EMPTY_IMAGE);

    useEffect(() => {
        const nextSrc = rawSrc || EMPTY_IMAGE;
        setImgSrc(nextSrc);
        // Show loader whenever a new external image URL is passed
        setIsLoading(!!rawSrc && rawSrc !== EMPTY_IMAGE);
    }, [rawSrc]);

    const handleLoad = (event: SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false);
        if (typeof node.props?.onLoad === "function") {
            node.props.onLoad(event);
        }
    };

    const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoading(false);
        if (typeof node.props?.onError === "function") {
            node.props.onError(event);
        }

        if (imgSrc !== EMPTY_IMAGE) {
            setImgSrc(EMPTY_IMAGE);
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
                component="img"
                {...node.props}
                src={imgSrc}
                onLoad={handleLoad}
                onError={handleError}
                alt={node.props?.alt || "Image"}
                sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: node.props?.objectFit || "cover",
                    display: "block",
                }}

            />
        </Box>
    );
}, {
    name: "Image",
    extends: "element",
    icon: ImageIcon,
    isInstance(target) {
        if ("tagName" in target && String(target.tagName).toLowerCase() === "img") {
            return true;
        }
        return false;
    },
    accepts: [],
    draggable: true,
    default: {
        name: "Image",
        tagName: "img",
        props: {
            src: EMPTY_IMAGE,
            alt: "Image",
            width: 200,
            height: 200,
        } as any
    }
});