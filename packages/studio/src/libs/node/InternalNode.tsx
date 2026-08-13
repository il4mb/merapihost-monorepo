"use client";

import { createContext, ReactNode, useContext, useState, useMemo, SetStateAction, Dispatch } from "react";
import { NodeModel } from "./NodeModel";

type InternalNodeProps = {
    children: ReactNode;
    node: NodeModel;
};

export default function InternalNode({ children, node }: InternalNodeProps) {
    const [data, setData] = useState<Record<string, unknown>>(node.type.data);
    const values = useMemo(() => ({
        node,
        data,
        setData
    }), [node, data]);

    return (
        <Context.Provider value={values}>
            {children}
        </Context.Provider>
    );
}

type InternalNodeContextType<T extends Record<string, unknown>> = {
    node: NodeModel;
    data: T;
    setData: Dispatch<SetStateAction<T>>;
}
const Context = createContext<InternalNodeContextType<any> | undefined>(undefined);

export function useInternalNode<T extends Record<string, unknown>>() {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useInternalNode must be used within an InternalNode component");
    }
    return context as InternalNodeContextType<T>;
}