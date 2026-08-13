"use client";
import { studioReducer, initialState } from "@/libs/reducer";
import { createContext, useContext, ReactNode, useReducer, memo, Dispatch, useMemo } from "react";
import type { EditorAction, EditorState, NodeState, GenericAction, NodeActions } from "@/types";
import AssetsProvider from "./AssetsProvider";
import PagesProvider from "./PagesProvider";
import { useRegisterShortcuts, useMainShortcutListener } from "@/hooks";
import GlobalKeyListenerProvider from "./GlobalKeyListenerProvider";
import StudioEventsProvider from "./StudioEventsProvider";


interface StudioContextType {
    state: EditorState;
    dispatch: Dispatch<EditorAction>;

}
const StudioContext = createContext<StudioContextType | undefined>(undefined);
export const useStudio = () => {
    const context = useContext(StudioContext);
    if (!context) {
        throw new Error("useStudio must be used within a StudioProvider");
    }
    return context;
}

export const useNodesReducer = () => {
    const { state, dispatch } = useStudio();
    return useMemo(() => ({
        state: state.nodes,
        dispatch
    } as {
        state: NodeState;
        dispatch: Dispatch<GenericAction<NodeActions>>;
    }), [state.nodes]);
}


interface StudioProviderProps {
    children: ReactNode;
}
export default function StudioProvider({ children }: StudioProviderProps) {
    const [state, dispatch] = useReducer(studioReducer, initialState);
    const value = { state, dispatch };
    return (
        <StudioContext.Provider value={value}>
            <GlobalKeyListenerProvider>
                <StudioEventsProvider>
                    <RegisterMainShortcuts>
                        <AssetsProvider>
                            <PagesProvider>
                                {children}
                            </PagesProvider>
                        </AssetsProvider>
                    </RegisterMainShortcuts>
                </StudioEventsProvider>
            </GlobalKeyListenerProvider>
        </StudioContext.Provider>
    );
}

const RegisterMainShortcuts = memo(({ children }: { children: ReactNode }) => {
    const shortcuts = useMainShortcutListener();
    useRegisterShortcuts(shortcuts);
    return children;
}); 