import { BlockNode } from "@/types";
import BlockElement from "./components/BlockElement";
import { createTheme, ThemeProvider } from "@mui/material/styles";

interface AppProps {
    title: string;
    blocks: BlockNode[];
}

export default function App({ title, blocks }: AppProps) {
    const theme = createTheme({
        cssVariables: true,
        palette: {
            mode: "light",
        },
    });
    return (
        <ThemeProvider theme={theme}>
            {blocks
                .filter(block => block.parent === null)
                .map(block => (
                    <BlockElement
                        key={block.id}
                        block={block}
                        blocks={blocks}
                    />
                ))}
        </ThemeProvider>
    );
}