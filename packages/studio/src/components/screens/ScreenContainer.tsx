"use client";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";

type ScreenContainerProps = {
    children?: ReactNode;
};

export default function ScreenContainer({ children }: ScreenContainerProps) {
    const [rect, setRect] = useState<DOMRect | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateRect = () => {
            if (containerRef.current) {
                setRect(containerRef.current.getBoundingClientRect());
            }
        };

        updateRect(); // Initial call to set the rect

        window.addEventListener("resize", updateRect);
        return () => {
            window.removeEventListener("resize", updateRect);
        };
    }, []);

    const values = useMemo(() => ({
        ref: containerRef,
        rect
    }), [rect]);

    return (
        <Context.Provider value={values}>
            <Box
                component={Paper}
                elevation={0}
                ref={containerRef}
                sx={{
                    flex: 1,
                    position: "relative",
                    overflow: "visible",
                    pointerEvents: "none",
                }}>
                {children}
            </Box>
        </Context.Provider>
    );
}

interface ScreenContainerContextType {
    ref: React.RefObject<HTMLDivElement>;
    rect: DOMRect | null;
}
const Context = createContext<ScreenContainerContextType | undefined>(undefined);

export const useScreenContainer = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useScreenContainer must be used within a ScreenContainer");
    }
    return context;
}
