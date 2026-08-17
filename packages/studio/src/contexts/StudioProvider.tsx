"use client";
import { createContext, useContext, ReactNode, useReducer, memo, Dispatch, useMemo } from "react";
import type { StudioReducerAction, StudioState } from "@/types";
import { AssetsProvider, PagesProvider, NodesProvider, GlobalKeyListenerProvider, EventsProvider } from "@/contexts";
import { useRegisterShortcuts, useMainShortcutListener } from "@/hooks";
import { INITIAL_STUDIO_STATE, studioReducer } from "@/libs/reducers";

interface StudioContextType { state: StudioState; dispatch: Dispatch<StudioReducerAction>; }
const StudioContext = createContext<StudioContextType | undefined>(undefined);
export const useStudio = () => {
    const context = useContext(StudioContext);
    if (!context) {
        throw new Error("useStudio must be used within a StudioProvider");
    }
    return context;
}

interface StudioProviderProps {
    children: ReactNode;
}
export default function StudioProvider({ children }: StudioProviderProps) {
    const [state, dispatch] = useReducer(studioReducer, INITIAL_STUDIO_STATE);
    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
    return (
        <StudioContext.Provider value={value}>
            <NodesProvider>
                <GlobalKeyListenerProvider>
                    <EventsProvider>
                        <RegisterMainShortcuts>
                            <AssetsProvider>
                                <PagesProvider>
                                    {children}
                                </PagesProvider>
                            </AssetsProvider>
                        </RegisterMainShortcuts>
                    </EventsProvider>
                </GlobalKeyListenerProvider>
            </NodesProvider>
        </StudioContext.Provider>
    );
}

const RegisterMainShortcuts = memo(({ children }: { children: ReactNode }) => {
    const shortcuts = useMainShortcutListener();
    useRegisterShortcuts(shortcuts);
    return children;
}); 