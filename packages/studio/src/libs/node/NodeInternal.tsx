import { createContext, RefObject, useCallback, useContext, useMemo, useRef } from "react";
import { NodeModel, NodeRender } from ".";
import { useNodes, useNodeCollectionRef } from "@/contexts";

type NodeInternalProps = {
    node: NodeModel;
    ref: RefObject<HTMLElement>
};

export default function NodeInternal({ node, ref }: NodeInternalProps) {

    const { state, dispatch } = useNodes();
    const collectionRef = useNodeCollectionRef();
    const nodeRef = useRef(node);

    const invokeCommand = useCallback((id: string, props?: any) => {
        return nodeRef.current.type.invokeCommand(
            id,
            nodeRef.current.type.createContext(
                dispatch,
                collectionRef.current,
            ),
            props
        );
    }, [nodeRef]);

    const childrenNode = useMemo(() => {
        const id = node.id;
        return Array.from(state.collection.values())
            .filter(n => n.parent === id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [state.collection, node.id]);

    const children = childrenNode.map(n => <NodeRender key={n.id} node={n} />);
    const Component = useMemo(() => node.type.render, [node.type]);


    const values = useMemo(() => ({
        invokeCommand
    }), [invokeCommand]);


    if (Component) {
        return (
            <Context.Provider value={values}>
                <Component key={node.id} node={node} ref={ref} childrenNode={childrenNode}>
                    {children}
                </Component>
            </Context.Provider>
        );
    }

    return (
        <div style={{ border: "1px solid red", padding: "8px", color: "red" }} ref={ref as any}>
            Unknown type: {node.type.name} (id: {node.id})
        </div>
    );
}

type NodeInternalContextType = {
    invokeCommand: (id: string, props?: any) => any;
}
const Context = createContext<NodeInternalContextType | undefined>(undefined);
export const useNodeInternal = () => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("useNodeInternal must with in NodeInternal");
    return ctx;
}