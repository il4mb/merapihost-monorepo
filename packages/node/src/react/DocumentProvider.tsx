import { Document, Node } from "@/engine";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type DocumentContext = {
    head: Node<"element">;
    body: Node<"element">;
    nodes: ReadonlyMap<string, Node>;
    getChildren: (typeof Document)["prototype"]["getChildren"];
};
const Context = createContext<DocumentContext | undefined>(undefined);
export const useDocument = () => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("useDocument must with in DocumentProvider");
    return ctx;
};

type DocumentProviderProps = {
    children: ReactNode;
};

export default function DocumentProvider({ children }: DocumentProviderProps) {
    const [document, setDocument] = useState(
        new Document([
            {
                id: "123",
                type: "element",
            },
            {
                id: "1111",
                type: "text",
                parent: "123",
                data: {
                    text: "Hallo World",
                },
            },
        ]),
    );
    const [nodes, setNodes] = useState<ReadonlyMap<string, Node>>(document.nodes);
    const getChildren = useCallback((node: Node<any>) => document.getChildren(node), [document]);

    useEffect(() => {
        document.body.elementRef.current = window.document.body;
        document.head.elementRef.current = window.document.head;
    }, [document.body, document.head]);

    const values = useMemo<DocumentContext>(
        () => ({
            getChildren,
            nodes,
            head: document.head,
            body: document.body,
        }),
        [nodes, getChildren],
    );
    return <Context.Provider value={values}>{children}</Context.Provider>;
}
