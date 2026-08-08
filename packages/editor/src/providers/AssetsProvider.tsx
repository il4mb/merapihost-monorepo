import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useEditor } from "@editor/providers/EditorProvider";
import { Box, Typography } from "@mui/material";

export interface AssetsContextType {
    isDragging: boolean;
}

const Context = createContext<AssetsContextType | undefined>(undefined);

type AssetsProviderProps = {
    children: ReactNode;
};

export default function AssetsProvider({ children }: AssetsProviderProps) {
    const { state } = useEditor();
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

    useEffect(() => {
        const handleDragEnter = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
            dragCounter.current += 1;

            if (event.dataTransfer?.items && event.dataTransfer.items.length > 0) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
            dragCounter.current -= 1;

            if (dragCounter.current === 0) {
                setIsDragging(false);
            }
        };

        const handleDragOver = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();
        };

        const handleDrop = (event: DragEvent) => {
            event.preventDefault();
            event.stopPropagation();

            dragCounter.current = 0;
            setIsDragging(false);

            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
                const fileArray = Array.from(files);
                console.log("Dropped files:", fileArray);
                // Handle the dropped files here
            }
        };

        document.addEventListener("dragenter", handleDragEnter);
        document.addEventListener("dragleave", handleDragLeave);
        document.addEventListener("dragover", handleDragOver);
        document.addEventListener("drop", handleDrop);

        return () => {
            document.removeEventListener("dragenter", handleDragEnter);
            document.removeEventListener("dragleave", handleDragLeave);
            document.removeEventListener("dragover", handleDragOver);
            document.removeEventListener("drop", handleDrop);
        };
    }, []);

    return (
        <Context.Provider value={{ isDragging }}>
            {children}
            {isDragging && (
                <Box sx={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 9999,
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    pointerEvents: "none",
                    userSelect: "none",
                }}>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        Drop files here
                    </Typography>
                </Box>
            )}
        </Context.Provider>
    );
}

export const useAssetsContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useAssetsContext must be used within an AssetsProvider");
    }
    return context;
};