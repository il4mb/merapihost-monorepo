import { nanoid } from "nanoid";
import type { Document } from "./Document";
import type { Model, ModelCommands } from "./Model";
import { JSX } from "react/jsx-runtime";
import { DataDefinition, RegistryKey } from "@nodes/types/type";
import { Commands } from "./Commands";


export class Node<T extends RegistryKey> {

    private _id = nanoid();
    readonly commands: ModelCommands<T>;
    readonly type: T;

    parent: Node<T> | null = null;
    element: HTMLElement | null = null;
    tagName: keyof JSX.IntrinsicElements = "div";
    order: number = 0;

    data: DataDefinition<T> = {} as DataDefinition<T>;
   

    constructor(
        public owner: Document,
        public model: Model<T>,
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

    appendChild(child: Node<T>) {
        child.parent = this;
        this.owner.addNode(child);
    }

    removeChild(child: Node<T>) {
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


    clone(): Node<T> {
        const clonedNode = new Node(this.owner, this.model);
        clonedNode.id = nanoid(); // Assign a new unique ID for the cloned node
        return clonedNode as Node<T>;
    }

}