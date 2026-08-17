import { INITIAL_NODES_STATE, nodeReducer } from "@/libs/reducers";
import { NodeReducerAction, NodeState } from "@/types";
import { createContext, Dispatch, ReactNode, RefObject, useContext, useEffect, useMemo, useReducer, useRef } from "react";

type NodesContextType = {
    state: NodeState,
    dispatch: Dispatch<NodeReducerAction>
}
const NodesContext = createContext<NodesContextType | undefined>(undefined);

export default function NodesProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(nodeReducer, INITIAL_NODES_STATE);

    const collectionRef = useRef(state.collection);
    useEffect(() => {
        collectionRef.current = state.collection;
    }, [state.collection]);

    const value = useMemo(() => ({
        state: { ...state, collectionRef },
        dispatch
    }), [state, dispatch]);

    return (
        <NodesContext.Provider value={value}>
            {children}
        </NodesContext.Provider>
    );
}

export const useNodes = (): NodesContextType => {
    const context = useContext(NodesContext);
    if (!context) throw new Error("useNodes must be used within a NodesProvider");
    return context;
};

export const useNodeCollectionRef = () => (useNodes().state as any).collectionRef as RefObject<NodeState['collection']>