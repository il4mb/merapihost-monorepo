import { BlockNode } from "@/types/client";
import BlockElement from "./components/BlockElement";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect } from "react";
import { Webpage } from "@/entities/webpage";

interface AppProps {
    page: Webpage;
    blocks: BlockNode[];
}

export default function App({ page, blocks }: AppProps) {
    const theme = createTheme({
        cssVariables: true,
        palette: {
            mode: "light",
        },
    });
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Remove the initial data script tag after the app has mounted to prevent duplicate data on re-renders
            document.head.querySelector("script#initial-data")?.remove();
        }
    }, []);
    return (
        <ThemeProvider theme={theme}>
            {blocks.filter(block => block.parent === null).map(block => (
                <BlockElement
                    key={block.id}
                    block={block}
                    blocks={blocks}
                />
            ))}
        </ThemeProvider>
    );
}