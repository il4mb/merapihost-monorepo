import { createContext, createElement, ElementType, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useEditor } from "./EditorProvider"
import { nanoid } from "nanoid"
import { Component, NodeObject } from "../type"
import { Element } from "../base/Element"
import Connector from "./Connector"
import { Root } from "../base/Root"
import NodeOwnerProvider, { useNodeOwner } from "./NodeOwnerProvider"
import { useTypeRegistry } from "./TypeRegistry"

type Props = {
    children?: React.ReactNode
    /* The component model reference */
    // component: Component
    /* The element type to render, can be a string or a React component */
    // as: ElementType
    type: ElementType
    name?: string
    props?: any
    ref?: React.RefObject<HTMLElement | null> | ((instance: HTMLElement | null) => void) | null
}

export default function NodeProvider({ children, type, name, props }: Props) {
    const { getComponent } = useTypeRegistry();
    const { dispatch, state } = useEditor();
    const parent = useContext(NodeContext);
    const owner = useNodeOwner();
    const elRef = useRef<HTMLElement | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // const ComponentClass = component;
    const isElementNode = type === Element;
    const isLegacyComponent = type === Element || type === Root;

    // 2. Initialize node synchronously. The first ADD_NODE dispatch will now have the correct type.
    const [node, setNode] = useState<NodeObject>(() => {
        let initialType = "Element";
        let initialName = name || "Element"; 
        let initialProps = props;

        if (type && typeof type !== "string") {
            initialType = type.model?.name || "Element";
            // @ts-ignore
            initialName = typeof type === "string" ? type : name || type.model?.name || type.render?.name || type.displayName || "Element";
            initialProps = {
                ...type.model?.props,
                ...props,
                ...(type === Element ? { as: typeof type === "string" ? type : "div" } : {})
            };
        } else if (owner) {
            initialName = name || (type as any).name || (type as any).render?.name || (type as any).displayName || "Element";
        }

        return {
            id: nanoid(),
            data: {
                parent: parent?.id || null,
                type: initialType,
                name: initialName,
                props: initialProps,
                linkedNodes: {}
            },
            dom: null
        };
    });

    // const shouldPushChangesRef = useRef(true);
    // const stateNode = useMemo(() => state.nodes.get(node.id) || null, [state.nodes, node.id])

    // // Pull changes from editor state when node data is updated externally
    // useEffect(() => {
    //     if (!stateNode) return;
    //     shouldPushChangesRef.current = false;
    //     setNode(prev => ({
    //         ...prev,
    //         data: {
    //             ...prev.data,
    //             props: {
    //                 ...prev.data.props,
    //                 ...stateNode.data.props
    //             }
    //         }
    //     }))
    // }, [stateNode?.data.props]);

    const onConnect = useCallback((el: HTMLElement | null) => {
        if (elRef.current === el) return;
        elRef.current = el;
        setNode(prev => ({ ...prev, dom: el }));
    }, []);

    const onLinkedNode = useCallback((linkedNodeId: string, elementId: string) => {
        setNode(prev => ({
            ...prev,
            data: {
                ...prev.data,
                linkedNodes: {
                    ...prev.data.linkedNodes,
                    [elementId]: linkedNodeId
                }
            }
        }))
    }, []);

    // Register node on mount and unregister on unmount
    useEffect(() => {
        dispatch({ type: "ADD_NODE", payload: node });
        setIsMounted(true);
        return () => {
            dispatch({ type: "DELETE_NODE", payload: node.id });
            setIsMounted(false);
        }
    }, [node.id]);

    // // Handle dynamic Component changes AFTER initial mount (e.g., if resolver populates late)
    // useEffect(() => {
    //     if (!isMounted) return;
    //     console.log("NodeProvider: Resolving component for type", type, "->", ComponentClass);

    //     if (!ComponentClass) {
    //         if (owner) {
    //             setNode(prev => ({
    //                 ...prev,
    //                 data: {
    //                     ...prev.data,
    //                     type: "Unknown",
    //                     name: name ? name : (type as any).name || (type as any).render?.name || (type as any).displayName || "Unknown",
    //                 }
    //             }))
    //             if ("id" in props) owner.linkNode(node.id, props.id)
    //         }
    //         return
    //     }

    //     setNode(prev => ({
    //         ...prev,
    //         data: {
    //             ...prev.data,
    //             type: ComponentClass.model?.name || "Unknown",
    //             // @ts-ignore
    //             name: typeof type === "string" ? type : name ? name : ComponentClass.model?.name || ComponentClass.render?.name || ComponentClass.displayName || "Unknown",
    //             props: {
    //                 ...ComponentClass.model?.props,
    //                 ...prev.data.props,
    //                 ...props,
    //                 ...(ComponentClass === ElementNode ? { as: typeof type === "string" ? type : "div" } : {})
    //             }
    //         }
    //     }))
    // }, [ComponentClass, owner?.id, isMounted, type, name]);

    // // Push changes to editor state
    // useEffect(() => {
    //     if (!isMounted) return;
    //     if (!shouldPushChangesRef.current) {
    //         shouldPushChangesRef.current = true;
    //         return;
    //     }

    //     dispatch({ type: "UPDATE_NODE", payload: node })
    // }, [node, isMounted]);

    // // Parent-Child Linking Logic
    // useEffect(() => {
    //     setNode(prev => ({
    //         ...prev,
    //         data: {
    //             ...prev.data,
    //             parent: parent?.id || null
    //         }
    //     }))
    // }, [parent?.id]);

    return (
        <NodeContext.Provider value={node}>
            {/* {children} */}
            <Connector onConnect={onConnect}>
                {/* <ComponentClass {...node.data.props}> */}
                {children}
                {/* </ComponentClass> */}
            </Connector>
            {/* {isLegacyComponent ? (
                <Connector onConnect={onConnect}>
                    <ComponentClass {...node.data.props}>
                        {children}
                    </ComponentClass>
                </Connector>
            ) : (
                <NodeOwnerProvider node={node} onLinkedNode={onLinkedNode}>
                    <Connector onConnect={onConnect}>
                        {createElement(type, { ...node.data.props }, children)}
                    </Connector>
                </NodeOwnerProvider>
            )} */}
        </NodeContext.Provider>
    )
}

const NodeContext = createContext<NodeObject | null>(null);
export const useCurrentNode = () => {
    return useContext(NodeContext);
}