import { Document, Node } from "@/engine";
import { Register } from "@/engine/Register";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ContainerContext = {
    head: Node<"element">;
    body: Node<"element">;
    nodes: ReadonlyMap<string, Node>;
    getChildren: (typeof Document)["prototype"]["getChildren"];
};
const Context = createContext<ContainerContext | undefined>(undefined);
export const useContainer = () => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("useContainer must with in ContainerProvider");
    return ctx;
};

type ContainerProviderProps = {
    children: ReactNode;
};

export default function ContainerProvider({ children }: ContainerProviderProps) {
    const [container, setContainer] = useState(
        new Document(new Register(), [
            // {
            //     id: "123",
            //     type: "element",
            // },
            {
                id: "1111",
                type: "text",
                parent: "123",
                data: {
                    text: "Hallo World",
                },
            },
            // {
            //     id: "333",
            //     type: "element",
            //     children: [
            //         {
            //             id: "222",
            //             type: "text",
            //             order: 1,
            //             data: {
            //                 text: "Hallo World",
            //             },
            //         },
            //         {
            //             id: "2232",
            //             type: "text",
            //             order: 0,
            //             data: {
            //                 text: "Hallo World 2",
            //             },
            //         },
            //     ],
            // },
        ]),
    );
    const [nodes, setNodes] = useState<ReadonlyMap<string, Node>>(container.nodes);
    const getChildren = useCallback((node: Node<any>) => container.getChildren(node), [container]);

    useEffect(() => {
        container.head.element = window.document.head;
        container.body.element = window.document.body;
    }, [container.body, container.head]);

    const values = useMemo<ContainerContext>(
        () => ({
            getChildren,
            nodes,
            head: container.head,
            body: container.body,
        }),
        [nodes, getChildren],
    );
    return <Context.Provider value={values}>{children}</Context.Provider>;
}
