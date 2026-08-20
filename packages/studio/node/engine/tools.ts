import {  Node } from "@nodes";
import { NodeObject } from "@nodes/types/node";

export const REGISTRY = new Map<string, Node>();
export const ROOT_NODE: NodeObject = {
    id: "root",
    type: "root",
    name: "Root Node",
}


export const findNode = (id: string | null | undefined, map: Map<string, Node>) => id ? map.get(id) ?? null : null;

/**
 * Walk up finder
 * @param node 
 * @param collection 
 * @returns Map<string, Node>
 */
export const getNodeAncestors = (node: Node, collection: Map<string, Node>) => {
    const result = new Map<string, Node>();
    let currentNode: Node | undefined = node;

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
export const getNodeAncestorChain = (startId: string, endId: string, map: Map<string, Node>): Node[] => {
    const chain: Node[] = [];
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
 * @returns Map<string, Node>
 */
export const getNodeDescendants = (node: Node, collection: Map<string, Node>) => {
    const childrenMap = new Map<string, Node[]>();
    for (const child of collection.values()) {
        if (!child.parent) continue;
        const children = childrenMap.get(child.parent);
        if (children) {
            children.push(child);
        } else {
            childrenMap.set(child.parent, [child]);
        }
    }

    const descendants = new Map<string, Node>();
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
 * @returns Map<string, Node>
 */
export const getNodeChildren = (node: Node, collection: Map<string, Node>) => {
    const childrenArray = Array.from(collection.values())
        .filter(n => n.parent === node.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Convert the array of objects into an array of [key, value] tuples for the Map constructor
    return new Map(childrenArray.map(n => [n.id, n]));
}


export const getNodeSiblings = (node: Node, collection: Map<string, Node>) => {
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
export const purgeOrphanNodes = (map: Map<string, Node>) => {
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

const getTopLevelNodes = (collections: Map<string, Node>) => {
    return Array.from(collections.values())
        .filter((node) => !node.parent || !collections.has(node.parent))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/**
 * Normalize node orders recursively.
 */
export const normalizeNodeOrders = (collections: Map<string, Node>) => {
    const childrenByParent = new Map<string, Node[]>();

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



type TreeNode = NodeObject & {
    children: TreeNode[];
};

export const toNodeTree = (collections: Map<string, Node>): TreeNode[] => {
    const nodes = new Map<string, TreeNode>();
    for (const node of collections.values()) {
        nodes.set(node.id, {
            ...node.toJSON(),
            children: [],
        });
    }

    const roots: TreeNode[] = [];
    for (const node of nodes.values()) {
        if (!node.parent || !nodes.has(node.parent)) {
            roots.push(node);
            continue;
        }
        nodes.get(node.parent)!.children.push(node);
    }
    const sort = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        for (const node of nodes) {
            sort(node.children);
        }
    };

    sort(roots);
    return roots;
};