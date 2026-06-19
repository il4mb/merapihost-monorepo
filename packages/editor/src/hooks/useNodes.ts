import { useCallback, useEffect, useMemo, useState } from "react";
import { TypeContext } from "../type";
import { NodeObject } from "../types/node";
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
    const node = useMemo(() => state.nodes.get(nodeId),[state.nodes, nodeId]);

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
};