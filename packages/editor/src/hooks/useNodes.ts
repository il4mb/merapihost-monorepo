import { useCallback, useEffect, useMemo, useState } from "react";
import { TypeContext } from "../type";
import { NodeObject, Variable } from "../types/node";
import { useTypeRegistry } from "../cores/TypeRegistry";
import { useEditor } from "../cores/EditorProvider";
import { isEqual } from "lodash";

export const useTypeContext = <T = any>(nodeId: string): TypeContext<T> => {
    const { registries } = useTypeRegistry();
    const { state } = useEditor();
    const node = useMemo(() => {
        return state.nodes.get(nodeId);
    }, [state.nodes, nodeId]);

    return useMemo(() => {
        return {
            node,
            dom: state.doms.get(nodeId) || null,
            type: node?.type ? registries[node.type] : undefined
        };
    }, [node, state.doms, registries, nodeId]);
}

export const useSelectedNodes = () => {
    const { state } = useEditor();
    const [selectedNodes, setSelectedNodes] = useState<NodeObject[]>([]);

    useEffect(() => {
        const selectedIds = Array.from(state.selected.values());
        const arrayNodes = Array.from(state.nodes.values());
        const selectedNodes = arrayNodes.filter(node => selectedIds.includes(node.id));
        setSelectedNodes(prev => {
            if (isEqual(prev, selectedNodes)) return prev;
            return selectedNodes;
        });
    }, [state.selected, state.nodes]);

    return selectedNodes;
}


export const useNodeTreeLevel = (nodeId: string) => {
    const { state } = useEditor();

    return useMemo(() => {
        const traversal: NodeObject[] = [];

        let current = state.nodes.get(nodeId);

        while (current) {
            traversal.unshift(current);

            current = current.parent
                ? state.nodes.get(current.parent)
                : undefined;
        }

        return traversal;
    }, [state.nodes, nodeId]);
};

export const useNodeName = (nodeId: string) => {
    const { state, dispatch } = useEditor();
    const node = useMemo(() => {
        return state.nodes.get(nodeId);
    }, [state.nodes, nodeId]);

    const setName = (name: string) => {
        dispatch({
            type: "UPDATE_NODE",
            payload: {
                id: nodeId,
                name
            }
        });
    }

    return [node.name || '', setName] as const;
}

export const useNodeVisibility = (nodeId: string) => {

    const { state, dispatch } = useEditor();
    const node = useMemo(() => state.nodes.get(nodeId), [state.nodes, nodeId]);

    const isParentVisible = useMemo(() => {
        if (!node?.parentId) return true;

        let current = state.nodes.get(node.parentId);

        while (current) {
            if (current.visible === false) {
                return false;
            }

            if (!current.parentId) {
                break;
            }

            current = state.nodes.get(current.parentId);
        }

        return true;
    }, [state.nodes, node]);

    const canToggle = !!node && isParentVisible;

    const setVisibility = (visible: boolean) => {
        if (!canToggle) return;

        dispatch({
            type: "UPDATE_NODE",
            payload: {
                id: nodeId,
                visible
            }
        });
    };

    return {
        visible: node?.visible ?? true,
        setVisibility,
        canToggle,
        isParentVisible
    };
}

type NodeVariable = Variable & {
    nodeId: string;
}

export const useNodeVariables = (nodeId: string) => {

    const { state, dispatch } = useEditor();
    const nodeLevel = useNodeTreeLevel(nodeId);
    const variables = useMemo(() => {
        const collections = new Map<string, NodeVariable>();
        nodeLevel.forEach(node => {
            const nodeVariables = state.variables.get(node.id);
            if (nodeVariables) {
                nodeVariables.forEach(variable => {
                    collections.set(variable.name, {
                        ...variable,
                        nodeId: node.id
                    });
                });
            }
        });
        return Array.from(collections.values());
    }, [nodeLevel, state.variables]);
    
    const setVariable = useCallback((variable: Variable) => {
        dispatch({
            type: "ADD_VARIABLE",
            payload: {
                nodeId,
                variable
            }
        });
    }, [dispatch, nodeId]);

    const removeVariable = useCallback((variableName: string) => {
        dispatch({
            type: "REMOVE_VARIABLE",
            payload: {
                nodeId,
                variableName
            }
        });
    }, [dispatch, nodeId]);

    const updateVariable = useCallback((variable: Variable) => {
        dispatch({
            type: "UPDATE_VARIABLE",
            payload: {
                nodeId,
                variable
            }
        });
    }, [dispatch, nodeId]);

    return useMemo(() => ({
        variables, setVariable, removeVariable, updateVariable
    }), [variables, setVariable, removeVariable, updateVariable]);
};