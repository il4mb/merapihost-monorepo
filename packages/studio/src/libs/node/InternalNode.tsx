"use client";

import { createContext, ReactNode, useContext } from "react";
import { NodeModel } from "./NodeModel";

type InternalNodeProps = {
    children: ReactNode;
    node: NodeModel;
};

export default function InternalNode({ children, node }: InternalNodeProps) {
    return (
        <Context.Provider value={{ node }}>
            {children}
        </Context.Provider>
    );
}

type InternalNodeContextType = {
    node: NodeModel;
}
const Context = createContext<InternalNodeContextType | undefined>(undefined);

export function useInternalNode() {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useInternalNode must be used within an InternalNodeProvider");
    }
    return context;
}