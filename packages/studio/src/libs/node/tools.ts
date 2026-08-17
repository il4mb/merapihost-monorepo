import { TypeModel, TypeComponent, NodeObject } from "@/types";
import { FC, RefObject } from "react";
import { NodeModel } from "./NodeModel";

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


export const getNodeModel = <T extends Record<string, unknown>>(node: NodeObject) => {
    return new NodeModel(node);
}


/**
 * Walk up finder
 * @param node 
 * @param collection 
 * @returns 
 */
export const getNodeAncesors = (node: NodeModel, collection: Map<string, NodeModel>) => {
    const result: NodeModel[] = [];
    let currentNode: NodeModel | undefined = node;

    while (currentNode.parent) {
        const parentNode = collection.get(currentNode.parent);
        if (!parentNode) break;
        result.push(parentNode);
        currentNode = parentNode;
    }
    return result;
}



/**
 * Wolk down finder
 * @param node 
 * @param collection 
 * @returns 
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
 * @returns 
 */
export const getNodeChildren = (node: NodeModel, collection: Map<string, NodeModel>) => {
    return Array.from(collection.values()).filter(n => n.parent === node.id).sort((a, b) => (a.order || 0) - (b.order || 0));
}