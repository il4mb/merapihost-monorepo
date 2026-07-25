import { renderToString } from "react-dom/server";
import App from "@/client/App";
import { PAGE_DATA } from "./constants";
import createEmotionCache from "./createEmotionCache";
import { CacheProvider } from "@emotion/react";
import createEmotionServer from "@emotion/server/create-instance";

interface RenderOptions {
    path: string;
}
export function render({ path }: RenderOptions) {

    const cache = createEmotionCache();
    const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache);

    const page = PAGE_DATA.find((route) => route.route.toLowerCase() === path.toLowerCase());
    const rendered = renderToString(
        <CacheProvider value={cache}>
            <App
                title={page?.title ?? "Default Title"}
                blocks={page?.data ?? []}
            />
        </CacheProvider>
    );

    const emotionChunks = extractCriticalToChunks(rendered);
    const styles = constructStyleTagsFromChunks(emotionChunks);

    return {
        id: page?.id ?? "default",
        route: page?.route ?? path,
        title: page?.title ?? "Default Title",
        description: page?.description ?? "Default Description",
        html: rendered,
        styles,
        meta: [...page?.meta ?? []],
    }

}