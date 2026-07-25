import { BlockNode } from "@/types/client";
import BlockElement from "./components/BlockElement";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Service } from "@/entities/service";

interface AppProps {
    title: string;
    blocks: BlockNode[];
    service: Service;
}

export default function App({ title, blocks, service }: AppProps) {
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