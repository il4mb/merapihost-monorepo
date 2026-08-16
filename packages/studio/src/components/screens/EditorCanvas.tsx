"use client";
import { inputsCustomizations, dataDisplayCustomizations, feedbackCustomizations, navigationCustomizations, surfacesCustomizations } from '@/theme/customizations';
import { colorSchemes, typography, shadows, shape } from '@/theme/themePrimitives';
import { styled, ThemeProvider, createTheme } from "@mui/material/styles";
import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { useStudio } from "@/contexts/StudioProvider";
import { CacheProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import createCache from "@emotion/cache";
import { createPortal } from "react-dom";
import { NodeModel } from "@/libs/node";
import { Block, NodeObject } from "@/types";
import { debounce } from "lodash";
import SpotsContainer from "./SpotsContainer";
import { useGlobalKeyListener } from '@/contexts/GlobalKeyListenerProvider';
import { RootType } from '@/libs/node/types/RootType';
import CanvasProvider from "@/contexts/CanvasProvider";


const Iframe = styled("iframe")({
    width: "100%",
    height: "100%",
    border: "none",
    overflow: "hidden",
    borderRadius: "8px",
    backgroundColor: "white",
    pointerEvents: "all",
});

const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'color-scheme',
        cssVarPrefix: 'merapi-studio',
    },
    colorSchemes,
    typography,
    shadows,
    shape,
    components: {
        ...inputsCustomizations,
        ...dataDisplayCustomizations,
        ...feedbackCustomizations,
        ...navigationCustomizations,
        ...surfacesCustomizations
    }
});

type EditorCanvasProps = {
    nodes: NodeObject[];
};

export default function EditorCanvas({ nodes }: EditorCanvasProps) {
    const { registerClient } = useGlobalKeyListener();
    const { state, dispatch } = useStudio();
    const [iframe, setIframe] = useState<HTMLIFrameElement | null>(null);
    const [isReady, setIsReady] = useState(false);
    const arrayNodeRef = useRef<NodeModel[]>([]);

    useEffect(() => {
        const iframeWindow = iframe?.contentWindow;
        if (!iframeWindow) return;
        return registerClient(iframeWindow);
    }, [registerClient, iframe]);

    useEffect(() => {
        arrayNodeRef.current = Array.from(state.nodes.collection.values());
    }, [state.nodes.collection]);

    useEffect(() => {
        if (!iframe) return;
        const handleLoad = () => {
            if (iframe.contentDocument?.head && iframe.contentDocument?.body) {
                setIsReady(true);
            }
        };
        iframe.addEventListener("load", handleLoad);
        if (iframe.contentDocument?.readyState === "complete") {
            handleLoad();
        }
        return () => iframe.removeEventListener("load", handleLoad);
    }, [iframe]);

    const cache = useMemo(() => {
        if (!isReady || !iframe?.contentDocument?.head) return null;
        return createCache({
            key: "merapi-studio",
            container: iframe.contentDocument.head
        });
    }, [isReady, iframe]);

    useEffect(() => {
        const nodeMap = new Map<string, NodeObject>();
        nodes.forEach(node => nodeMap.set(node.id, node));
        dispatch({ type: "SET_NODES", payload: nodeMap });
    }, [nodes]);

    return (
        <Fragment>
            <Iframe
                ref={setIframe}
                srcDoc="<!DOCTYPE html><html><head></head><body></body></html>"
                sandbox="allow-scripts allow-same-origin"
            />
            <CanvasProvider iframe={iframe} isReady={isReady}>
                {(isReady && cache && iframe?.contentDocument?.body) && createPortal(
                    <CacheProvider value={cache}>
                        <ThemeProvider
                            theme={theme}
                            modeStorageKey={"theme-mode"}
                            disableTransitionOnChange>
                            <CssBaseline />
                            <RootType dom={iframe} />
                        </ThemeProvider>
                    </CacheProvider>,
                    iframe.contentDocument.body
                )}
                <SpotsContainer />
            </CanvasProvider>
        </Fragment>
    );
}