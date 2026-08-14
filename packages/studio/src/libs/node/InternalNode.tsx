"use client";

import { createContext, ReactNode, useContext, useMemo, SetStateAction, Dispatch } from "react";
import { NodeModel } from "./NodeModel";
import { TypeModelData } from "@/types/common";

type InternalNodeProps = {
    children: ReactNode;
    node: NodeModel;
    data: TypeModelData;
    setData?: Dispatch<SetStateAction<TypeModelData>>;
};

export default function InternalNode({ children, node, data, setData }: InternalNodeProps) {
    const values = useMemo(() => ({
        node, data, setData
    }), [node, data, setData]);

    return (
        <Context.Provider value={values}>
            {children}
        </Context.Provider>
    );
}

type InternalNodeContextType<T extends Record<string, unknown>> = {
    node: NodeModel;
    data: TypeModelData<T>;
    setData?: Dispatch<SetStateAction<T>>;
}
const Context = createContext<InternalNodeContextType<any> | undefined>(undefined);

export function useInternalNode<T extends Record<string, unknown>>() {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useInternalNode must be used within an InternalNode component");
    }
    return context as InternalNodeContextType<T>;
}