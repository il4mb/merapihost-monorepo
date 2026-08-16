import { useMemo, useRef, useEffect, useCallback } from "react";
import { NodeData, NodeModel } from "@/types";
import { useNodesReducer } from "@/contexts/StudioProvider";


export const useMutateNodeData = <T extends Record<string, any> = Record<string, any>>(node: NodeModel<T>) => {
    const { dispatch } = useNodesReducer();
    const mutate = useCallback((data: Partial<NodeData<Record<string, any>>>) => {
        dispatch({
            type: "UPDATE_NODE",
            payload: {
                id: node.id,
                data: data
            }
        });
    }, [node.id]);
    return mutate;
}

export const useArrayNodeRef = () => {
    const { state } = useNodesReducer();
    const arrayNodeRef = useRef<NodeModel[]>([]);
    useEffect(() => {
        arrayNodeRef.current = Array.from(state.collection.values());
    }, [state.collection]);

    return arrayNodeRef;
}

export const useNodeChildren = (node: NodeModel) => {
    const { state } = useNodesReducer();
    return useMemo(() => {
        return Array.from(state.collection.values()).filter(n => n.parent === node.id).sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [state.collection, node.id]);
}
/**
 * Get the children of a given node in the node tree.  
 * @param node the node for which to find children
 * @returns an array of child nodes
 */
export const useVisibleNodeChildren = (node: NodeModel) => {
    return useNodeChildren(node).filter(n => n.visible !== false);
}

/**
 * Get the descendants of a given node in the node tree.
 * @param node the node for which to find descendants
 * @returns a map of descendant nodes keyed by their id
 */
export const useNodeDescendants = (node: NodeModel) => {
    const { state } = useNodesReducer();

    return useMemo(() => {
        const childrenMap = new Map<string, NodeModel[]>();

        for (const child of state.collection.values()) {
            if (!child.parent) continue;

            const children = childrenMap.get(child.parent);

            if (children) {
                children.push(child);
            } else {
                childrenMap.set(child.parent, [child]);
            }
        }

        const descendants = new Map<string, NodeModel>();

        const walk = (parentId: string) => {
            for (const child of childrenMap.get(parentId) ?? []) {
                descendants.set(child.id, child);
                walk(child.id);
            }
        };

        walk(node.id);

        return descendants;
    }, [state.collection, node.id]);
};

/**
 * Get a ref containing the descendants of a given node in the node tree.  
 * @param node the node for which to find descendants
 * @returns a ref containing a map of descendant nodes
 */
export const useNodeDescendantsRef = (node: NodeModel) => {
    const descendantsRef = useRef<Map<string, NodeModel>>(new Map());
    const descendants = useNodeDescendants(node);
    useEffect(() => {
        descendantsRef.current = descendants;
    }, [descendants]);
    return descendantsRef;
}

/**
 * Get the ancestors of a given node in the node tree.  
 * @param node the node for which to find ancestors
 * @returns an array of ancestor nodes
 */
export const useNodeAncestors = (node: NodeModel) => {
    const { state } = useNodesReducer();
    const ancestors = useMemo(() => {
        const result: NodeModel[] = [];
        let currentNode: NodeModel | undefined = node;

        while (currentNode.parent) {
            const parentNode = state.collection.get(currentNode.parent);
            if (!parentNode) break;
            result.push(parentNode);
            currentNode = parentNode;
        }
        return result;
    }, [state.collection, node.parent]);

    return ancestors;
}

export const useFindNodeParent = (node: NodeModel, iterate: (node: NodeModel) => boolean) => {
    const { state } = useNodesReducer();
    const parent = useMemo(() => {
        let currentNode: NodeModel | undefined = node;
        while (currentNode.parent) {
            const parentNode = state.collection.get(currentNode.parent);
            if (!parentNode) break;
            if (iterate(parentNode)) {
                return parentNode;
            }
            currentNode = parentNode;
        }
        return undefined;
    }, [state.collection, node.parent, iterate]);

    return parent;
}

