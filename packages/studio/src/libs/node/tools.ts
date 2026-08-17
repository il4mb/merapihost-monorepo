import { TypeModel, TypeComponent, NodeObject } from "@/types";
import { FC, RefObject } from "react";
import { NodeModel } from "./NodeModel";
import { ROOT_NODE } from "../reducers/nodes";

type FCProps<T = any, P = any> = {
    node: NodeModel<T>;
    children: React.ReactNode;
    childrenNode: NodeModel[];
    ref: RefObject<HTMLElement | null>;
} & P;
type CreateTypeFC<T, P> = FC<FCProps<T, P>>;

export const createType = <T extends Record<string, unknown>, P = {}>(
    fc: CreateTypeFC<T, P>,
    model: TypeModel<T>
): TypeComponent<T> => {
    // @ts-ignore
    return Object.assign(fc, { model });
}



export const findNode = (id: string | null | undefined, map: Map<string, NodeModel>) => id ? map.get(id) ?? null : null;

/**
 * Walk up finder
 * @param node 
 * @param collection 
 * @returns Map<string, NodeModel>
 */
export const getNodeAncestors = (node: NodeModel, collection: Map<string, NodeModel>) => {
    const result = new Map<string, NodeModel>();
    let currentNode: NodeModel | undefined = node;

    while (currentNode.parent) {
        const parentNode = collection.get(currentNode.parent);
        if (!parentNode) break;

        result.set(parentNode.id, parentNode);
        currentNode = parentNode;
    }
    return result;
}

/**
 * Walk up finder until endId
 * @param startId starting node id
 * @param endId finish node id
 * @param map the collection
 * @returns ancestor chain
 */
export const getNodeAncestorChain = (startId: string, endId: string, map: Map<string, NodeModel>): NodeModel[] => {
    const chain: NodeModel[] = [];
    let current = findNode(startId, map);
    while (current && current.id !== endId) {
        chain.push(current);
        current = findNode(current.parent, map);
    }
    return chain;
};


/**
 * Walk down finder
 * @param node 
 * @param collection 
 * @returns Map<string, NodeModel>
 */
export const getNodeDescendants = (node: NodeModel, collection: Map<string, NodeModel>) => {
    const childrenMap = new Map<string, NodeModel[]>();
    for (const child of collection.values()) {
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
}

/**
 * Node Children Only
 * @param node 
 * @param collection 
 * @returns Map<string, NodeModel>
 */
export const getNodeChildren = (node: NodeModel, collection: Map<string, NodeModel>) => {
    const childrenArray = Array.from(collection.values())
        .filter(n => n.parent === node.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Convert the array of objects into an array of [key, value] tuples for the Map constructor
    return new Map(childrenArray.map(n => [n.id, n]));
}


export const getNodeSiblings = (node: NodeModel, collection: Map<string, NodeModel>) => {
    const childrenArray = Array.from(collection.values())
        .filter(n => n.parent === node.parent)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Convert the array of objects into an array of [key, value] tuples for the Map constructor
    return new Map(childrenArray.map(n => [n.id, n]));
}

/**
 * Remove parentles node
 * @param map 
 */
export const purgeOrphanNodes = (map: Map<string, NodeModel>) => {
    const validIds = new Set<string>();
    const traverse = (id: string) => {
        validIds.add(id);
        const children = Array.from(map.values()).filter((n) => n.parent === id);
        children.forEach((child) => traverse(child.id));
    };
    traverse(ROOT_NODE.id);

    map.forEach((n, id) => {
        if (!validIds.has(id)) {
            map.delete(id);
        }
    });
};

const getTopLevelNodes = (collections: Map<string, NodeModel>) => {
    return Array.from(collections.values())
        .filter((node) => !node.parent || !collections.has(node.parent))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/**
 * Normalize node orders recursively.
 */
export const normalizeNodeOrders = (collections: Map<string, NodeModel>) => {
    const childrenByParent = new Map<string, NodeModel[]>();

    // Group children by parent
    for (const node of collections.values()) {
        if (!node.parent) continue;
        const children = childrenByParent.get(node.parent) ?? [];
        children.push(node);
        childrenByParent.set(node.parent, children);
    }

    const normalize = (parentId: string) => {
        const children = childrenByParent.get(parentId);
        if (!children) return;
        children.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        children.forEach((child, index) => {
            child.order = index;
            normalize(child.id);
        });
    };

    // 1. Find all top-level nodes
    const topLevelNodes = getTopLevelNodes(collections);

    // 2. Normalize top-level order
    topLevelNodes.forEach((node, index) => {
        node.order = index;
        // 3. Normalize descendants
        normalize(node.id);
    });
};