import { createContext, RefObject, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { Model, Node, NodeRender } from "@nodes";
import { useNodes, useNodeCollectionRef } from "@/contexts";

type NodeInternalProps = {
    node: Node;
    ref: RefObject<HTMLElement>
}

type NodeInternalContextType = {
    invokeCommand: (id: string, props?: any) => any;
    wireCommand: (id: string, callback: (p?: any) => void) => () => void;
}

const Context = createContext<NodeInternalContextType | undefined>(undefined);
export const useNodeInternal = () => {
    const ctx = useContext(Context);
    if (!ctx) throw new Error("useNodeInternal must with in NodeInternal");
    return ctx;
}

export const useWireEffect = (id: string, callback: (props?: any) => void, deps?: any[]) => {
    const { wireCommand } = useNodeInternal();
    useEffect(() => {
        return wireCommand(id, callback);
    }, deps);
}

export default function NodeInternal({ node, ref }: NodeInternalProps) {

    const { state, dispatch } = useNodes();
    const collectionRef = useNodeCollectionRef();
    const wiredCommandRef = useRef<Map<string, (p?: any) => void>>(new Map());

    const childrenNode = useMemo(() => {
        const id = node.id;
        return Array.from(state.collection.values())
            .filter(n => n.parent === id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [state.collection, node.id]);

    const children = childrenNode.map(n => <NodeRender key={n.id} node={n} />);
    const Component = useMemo(() => node.type.render, [node.type]);

    const invokeCommand = useCallback((id: string, props?: any) => {
        return node.type.invokeCommand(
            id,
            new ModelContext(
                dispatch,
                collectionRef.current
            ),
            props
        );
    }, [node]);

    const wireCommand = useCallback((id: string, callback: (p?: any) => void) => {
        node.type.commands[id] = callback;
        wiredCommandRef.current.set(id, callback);
        node.type.wireCommand(id, callback); //  regist wired command
        return () => {
            wiredCommandRef.current.delete(id);
            node.type.unWireCommand(id);
        }
    }, []);

    const syncWireCommands = useCallback(() => {
        wiredCommandRef.current.forEach((command, id) => {
            node.type.wireCommand(id, command); //  regist wired command
        });
    }, [node]);

    useEffect(() => {
        syncWireCommands();
    }, [syncWireCommands]);

    const values = useMemo(() => ({
        invokeCommand,
        wireCommand
    }), [invokeCommand, wireCommand]);


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

