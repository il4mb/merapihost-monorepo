import type { PlainNodeObject } from "@nodes/types/node";
import { TYPE_REGISTRY } from "@nodes/registry";
import { Node } from "./Node";
import { RegistryKey } from "@nodes/types/type";
import type { Model } from "./Model";

export class Document {

    private _nodes: Map<string, Node<any>> = new Map();

    get nodes() {
        return Object.freeze(this._nodes);
    }

    public createNode<T extends RegistryKey>(type: T, nodeObject?: PlainNodeObject): Node<T> {
        const typeModel = TYPE_REGISTRY.get(type) as Model<T> | undefined;
        if (!typeModel) {
            throw new Error(`Type ${type} not found in registry`);
        }
        return typeModel.buildNode(this, nodeObject) as Node<T>;
    }

    constructor() {

        this._nodes.set("head", this.createNode("element", { id: 'head', tagName: 'head', }));
        this._nodes.set("body", this.createNode("element", { id: 'body', tagName: 'body', }));
    }

    addNode<T extends RegistryKey>(node: Node<T>) {

        if (node.owner !== this) {
            throw new Error("Node owner does not match the document");
        }

        const existingHeadNode = this.findNodes(n => n.tagName === "head");
        const existingBodyNode = this.findNodes(n => n.tagName === "body");
        if (node.tagName === "head" && existingHeadNode.length > 0) {
            throw new Error("Node with tagName 'head' already exists");
        }
        if (node.tagName === "body" && existingBodyNode.length > 0) {
            throw new Error("Node with tagName 'body' already exists");
        }

        this._nodes.set(node.id, node as Node<any>);
    }

    removeNode(nodeId: string) {
        if (nodeId === "head" || nodeId === "body") {
            throw new Error("Cannot remove node 'head' or 'body'");
        }
        this._nodes.delete(nodeId);
    }

    findNodes<T extends RegistryKey>(iterator: (node: Node<any>) => boolean): Node<T>[] {
        const foundNodes: Node<any>[] = [];
        for (const node of this._nodes.values()) {
            if (iterator(node)) {
                foundNodes.push(node);
            }
        }
        return foundNodes as Node<T>[];
    }

    getNode<T extends RegistryKey>(nodeId: string): Node<T> | undefined {
        return this._nodes.get(nodeId) as Node<T> | undefined;
    }

    getAllNodes(): Node<RegistryKey>[] {
        return Array.from(this._nodes.values());
    }
}