import { nanoid } from "nanoid";
import type { Document } from "./Document";
import type { Model } from "./Model";

export interface NodeContext {
    // node: NodeObject | null;
    // type: ModelProxy | null;
    // dom: HTMLElement | null;
}

export class Node<T extends Record<string, unknown> = Record<string, unknown>> {

    id: string;
    parent: Node | null = null;
    element: HTMLElement | null = null;
    tagName: string = "div"; 
    order: number = 0;
    type: string;

    constructor(public owner: Document, public model: Model<T>) {
        this.id = nanoid();
        this.type = model.id;
    }

    appendChild(child: Node) {
        child.parent = this;
        this.owner.addNode(child);
    }

    removeChild(child: Node) {
        if (child.parent !== this) {
            throw new Error("The specified node is not a child of this node.");
        }
        child.parent = null;
        this.owner.removeNode(child.id);
    }

    delete() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.owner.removeNode(this.id);
    }


    clone(): Node {
        const clonedNode = new Node(this.owner, this.model);
        clonedNode.id = nanoid(); // Assign a new unique ID for the cloned node
        return clonedNode;
    }


}