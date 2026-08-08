import React, { createContext, useContext, useMemo, useReducer, Reducer, useEffect, useRef } from "react";
import { NodeObject } from "../types/node";
import { EditorAction, EditorState } from "../types";
import { editorReducer, initialState } from "../cores/reducer";
import { isEqual } from "lodash";
import AssetsProvider from "./AssetsProvider";

interface EditorProviderProps {
    children?: React.ReactNode;
    onChange?: (blocks: NodeObject[]) => void;
    nodes?: NodeObject[];
    options?: EditorState["options"];
}

export default function EditorProvider({ children, onChange, nodes, options }: EditorProviderProps) {

    const [state, dispatch] = useReducer(
        editorReducer as Reducer<EditorState, EditorAction>,
        initialState
    );

    const stateNodesRef = useRef(state.nodes);
    useEffect(() => {
        if (!isEqual(state.nodes, stateNodesRef.current)) {
            stateNodesRef.current = state.nodes;
            if (onChange) {
                const blocks = Array.from(state.nodes.values());
                onChange(blocks);
            }
        }
    }, [state.nodes, onChange]);

    useEffect(() => {
        if (nodes) {
            const currentNodes = Array.from(stateNodesRef.current.values());
            if (!isEqual(nodes, currentNodes)) {
                const nodesMap = new Map<string, NodeObject>();
                nodes.forEach(node => nodesMap.set(node.id, node));
                dispatch({ type: "SET_NODES", payload: nodesMap });
            }
        }
    }, [nodes]);

    useEffect(() => {
        if (options) {
            dispatch({ type: "SET_OPTIONS", payload: options });
        }
    }, [options]);

    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return (
        <EditorContext.Provider value={value}>
            <AssetsProvider>
                <ViewportContext.Provider value={state.viewport}>
                    {children}
                </ViewportContext.Provider>
            </AssetsProvider>
        </EditorContext.Provider>
    );
};

export type EditorContextType = {
    state: EditorState
    dispatch: React.Dispatch<EditorAction>
};
const EditorContext = createContext<EditorContextType | null>(null);
const ViewportContext = createContext<EditorState["viewport"]>(initialState.viewport);

// Custom hooks for consuming the contexts
export const useEditor = () => {
    const ctx = useContext(EditorContext);
    if (!ctx) {
        throw new Error("useEditor must be used within an EditorProvider");
    };
    return ctx;
};
// export const useNodes = () => useContext(NodesContext)
// export const useSelectedNodes = () => useContext(SelectedNodesContext)
// export const useHoveredNode = () => useContext(HoveredNodeContext)
export const useViewport = () => useContext(ViewportContext);