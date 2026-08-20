import { nanoid } from "nanoid";
import type { Document } from "./Document";
import type { Model } from "./Model";
import { JSX } from "react/jsx-runtime";
import { CommandDefinition, RegistryKey } from "@nodes/types/type";
import { Commands } from "./Commands";

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

    private _id = nanoid();
    readonly commands: C

    parent: Node<T, P, C> | null = null;
    element: HTMLElement | null = null;
    tagName: keyof JSX.IntrinsicElements = "div";
    order: number = 0;
    type: T;
    props: P = {} as P;


    constructor(
        public owner: Document,
        public model: Model<P, C>
    ) {
        this.id = nanoid();
        this.type = model.name as T;
        this.commands = new Proxy(model.commands, new Commands(this));
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
        return clonedNode as Node<T, P, C>;
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