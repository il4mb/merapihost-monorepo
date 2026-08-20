import type { NodeObject } from "@nodes/types";
import { TYPE_REGISTRY } from "./registry";
import { Model } from "./Model";
import { Node } from "./Node";

type PlainNodeObject = Omit<NodeObject<any>, "type" | "id"> & {
    id?: string;
}

export class Document extends Model {

    private _nodes: Map<string, Node> = new Map();

    get nodes() {
        return Object.freeze(this._nodes);
    }

    public createNode<T extends Record<string, unknown>>(type: string, nodeObject?: PlainNodeObject): Node<T> {
        const typeModel = TYPE_REGISTRY.get(type);
        if (!typeModel) {
            throw new Error(`Type ${type} not found in registry`);
        }
        return typeModel.buildNode(this, nodeObject);
    }

    constructor() {

        super({
            component: () => null,
            state: () => ({}),
            name: "Document",
        });

        this._nodes.set("head", this.createNode("element", { id: 'head', tagName: 'head', }));
        this._nodes.set("body", this.createNode("element", { id: 'body', tagName: 'body', }));
    }

    addNode(node: Node) {
        
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

        this._nodes.set(node.id, node);
    }

    removeNode(nodeId: string) {
        if (nodeId === "head" || nodeId === "body") {
            throw new Error("Cannot remove node 'head' or 'body'");
        }
        this._nodes.delete(nodeId);
    }


    findNodes(iterator: (node: Node) => boolean): Node[] {
        const foundNodes: Node[] = [];
        for (const node of this._nodes.values()) {
            if (iterator(node)) {
                foundNodes.push(node);
            }
        }
        return foundNodes;
    }

    getNode(nodeId: string): Node | undefined {
        return this._nodes.get(nodeId);
    }

    getAllNodes(): Node[] {
        return Array.from(this._nodes.values());
    }
}