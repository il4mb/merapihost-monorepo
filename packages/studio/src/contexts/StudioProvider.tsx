"use client";
import { studioReducer, initialState } from "@/libs/reducer";
import { createContext, useContext, ReactNode, useReducer } from "react";
import type { EditorAction, EditorState } from "@/types";

interface StudioProviderProps {
    children: ReactNode;
}
export default function StudioProvider({ children }: StudioProviderProps) {
    const [state, dispatch] = useReducer(studioReducer, initialState);
    const value = { state, dispatch };

    return (
        <StudioContext.Provider value={value}>
            {children}
        </StudioContext.Provider>
    );
}

interface StudioContextType {
    state: EditorState;
    dispatch: React.Dispatch<EditorAction>;

}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const useStudio = () => {
    const context = useContext(StudioContext);
    if (!context) {
        throw new Error("useStudio must be used within a StudioProvider");
    }
    return context;
}