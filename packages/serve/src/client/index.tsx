import { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.scss";
import { StrictMode } from "react";
import createEmotionCache from "./createEmotionCache";
import { CacheProvider } from "@emotion/react";
import { Webpage } from "@/entities/webpage";
import { BlockNode } from "@/types/client";

declare global {
    interface Window {
        __INITIAL_DATA__: {
            webpage: Webpage;
            blocks: BlockNode[];
        };
    }
}
const cache = createEmotionCache();

hydrateRoot(
    document.body,
    <StrictMode>
        <CacheProvider value={cache}>
            <App
                page={window.__INITIAL_DATA__.webpage}
                blocks={window.__INITIAL_DATA__.blocks}
            />
        </CacheProvider>
    </StrictMode>
);