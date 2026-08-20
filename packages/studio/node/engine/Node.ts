import { nanoid } from "nanoid";
import type { Document } from "./Document";
import type { Model } from "./Model";
import { JSX } from "react/jsx-runtime";
import { CommandDefinition, RegistryKey } from "@nodes/types/type";

export interface NodeContext {
    // node: NodeObject | null;
    // type: ModelProxy | null;
    // dom: HTMLElement | null;
}

export class Node<
    T extends RegistryKey,
    P extends Record<string, unknown> = {},
    C extends CommandDefinition<T> = CommandDefinition<T>
> {

    // id: string;
    parent: Node<T, P, C> | null = null;
    element: HTMLElement | null = null;
    tagName: keyof JSX.IntrinsicElements = "div";
    order: number = 0;
    type: T;
    props: P = {} as P;
    private _id = nanoid();

    constructor(
        public owner: Document,
        public model: Model<T, P, C>
    ) {
        this.id = nanoid();
        this.type = model.name;
    }

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this.owner.removeNode(this._id); // Remove the old ID from the document
        this._id = value;
        this.owner.addNode(this); // Add the new ID to the document
    }

    appendChild(child: Node<T, P, C>) {
        child.parent = this;
        this.owner.addNode(child);
    }

    removeChild(child: Node<T, P, C>) {
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


    clone(): Node<T, P, C> {
        const clonedNode = new Node(this.owner, this.model);
        clonedNode.id = nanoid(); // Assign a new unique ID for the cloned node
        return clonedNode;
    }


    private wiredMaps: Map<string, { callback: () => void; deps: any[] }> = new Map();
    get wires() {
        return this.wiredMaps;
    }

    wire(callback: () => void, deps: any[]) {
        const id = nanoid();
        this.wiredMaps.set(id, { callback, deps });
    }

    unWire(id: string) {
        this.wiredMaps.delete(id);
    }

    triggerWired() {
        for (const { callback } of this.wiredMaps.values()) {
            callback();
        }
    }


}