import { renderToString } from "react-dom/server";
import App from "@/client/App";
import createEmotionCache from "./createEmotionCache";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";
import { Webpage } from "@/entities/webpage";
import { BlockNode } from "@/types/client";

interface RenderOptions {
    webpage: Webpage;
    blocks: BlockNode[];
}
export function render({ webpage, blocks }: RenderOptions) {

    const cache = createEmotionCache();
    const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);
    const rendered = renderToString(
        <CacheProvider value={cache}>
            <App page={webpage} blocks={blocks} />
        </CacheProvider>
    );

    const emotionChunks = extractCriticalToChunks(rendered);
    const styles = constructStyleTagsFromChunks(emotionChunks);

    return {
        lang: "en",
        webpage,
        content: rendered,
        styles,
        blocks
    }
}