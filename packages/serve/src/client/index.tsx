import { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./styles.scss";
import { StrictMode } from "react";
import { BlockNode, MetaTag } from "@/types/client";
import { Service } from "@/entities/service";
import createEmotionCache from "./createEmotionCache";
import { CacheProvider } from "@emotion/react";

declare global {
    interface Window {
        __INITIAL_DATA__: {
            title: string;
            service: Service;
            blocks: BlockNode[];
        };
    }
}
const cache = createEmotionCache();

hydrateRoot(
    document.getElementById("root")!,
    <StrictMode>
        <CacheProvider value={cache}>
            <App
                title={window.__INITIAL_DATA__.title ?? "Default Title"}
                blocks={window.__INITIAL_DATA__.blocks}
                service={window.__INITIAL_DATA__.service}
            />
        </CacheProvider>
    </StrictMode>
);