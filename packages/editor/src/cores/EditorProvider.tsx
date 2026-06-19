import React, { createContext, useContext, useMemo, useReducer, Reducer, useEffect, useRef } from "react";
import { NodeObject } from "../types/node";
import { EditorAction, EditorState } from "../type";
import { editorReducer, initialState } from "../cores/reducer";
import { isEqual } from "lodash";

interface EditorProviderProps {
    children?: React.ReactNode;
    onChange?: (blocks: NodeObject[]) => void;
    nodes?: NodeObject[];
}

export default function EditorProvider({ children, onChange, nodes }: EditorProviderProps) {

    const [state, dispatch] = useReducer(
        editorReducer as Reducer<EditorState, EditorAction>,
        initialState
    );
    // Create a stable reference to the current nodes in the editor
    // const nodes = useMemo(() => Array.from(state.nodes.values()), [state.nodes]);

    const selectedNodes = useMemo(() => {
        if (!state.selected) return [];
        return Array.from(state.selected).map(id => state.nodes.get(id)).filter(Boolean) as NodeObject[]
    }, [state.selected, state.nodes]);

    const hoveredNode = useMemo(() => {
        if (!state.hovered) return [];
        return Array.from(state.hovered).map(id => state.nodes.get(id)).filter(Boolean) as NodeObject[]
    }, [state.hovered, state.nodes]);

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

    // const nodesRef = useRef(state.nodes)
    // useEffect(() => {
    //     console.log("Nodes:", Array.from(state.nodes.values()));
    //     // nodesRef.current = state.nodes;
    //     // if (onChange) {
    //     //     const blocks = Array.from(state.nodes.values()).filter(node => node.data.type === "Block") as BlockNode[];
    //     //     onChange(blocks);
    //     // }
    // }, [state.nodes]);

    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return (
        <EditorContext.Provider value={value}>
            <ViewportContext.Provider value={state.viewport}>
                {/* <NodesContext.Provider value={stableNodes}>
                    <SelectedNodesContext.Provider value={stableSelectedNodes}>
                        <HoveredNodeContext.Provider value={stableHoveredNode}> */}
                {children}
                {/* </HoveredNodeContext.Provider>
                    </SelectedNodesContext.Provider>
                </NodesContext.Provider> */}
            </ViewportContext.Provider>
        </EditorContext.Provider>
    )
}

export type EditorContextType = {
    state: EditorState
    dispatch: React.Dispatch<EditorAction>
}
const EditorContext = createContext<EditorContextType | null>(null)
// const NodesContext = createContext<Node[]>([])
// const SelectedNodesContext = createContext<Node[]>([])
// const HoveredNodeContext = createContext<Node[]>([])
const ViewportContext = createContext<EditorState["viewport"]>(initialState.viewport)

// Custom hooks for consuming the contexts
export const useEditor = () => {
    const ctx = useContext(EditorContext)
    if (!ctx) {
        throw new Error("useEditor must be used within an EditorProvider")
    }
    return ctx
}
// export const useNodes = () => useContext(NodesContext)
// export const useSelectedNodes = () => useContext(SelectedNodesContext)
// export const useHoveredNode = () => useContext(HoveredNodeContext)
export const useViewport = () => useContext(ViewportContext)