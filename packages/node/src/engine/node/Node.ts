import type { Model } from "../Model";
import { InferCommand, InferData } from "@/types/model";
import { Commands } from "../Commands";
import { MutableObject } from "../MutableObject";
import { NodeObject, PlainNodeObject } from "@/types/node";
import { Document } from "../Document";
import { createElement } from "react";
import { NodeEventEmitter } from "./NodeEventEmitter";

export class Node<T extends ModelName = ModelName> extends NodeEventEmitter {

    readonly commands: InferCommand<T, false>;
    readonly type: T;

    constructor(owner: Document, readonly model: Model<T>,) {
        super(owner);
        this.type = model.name as T;
        this.commands = new Proxy(model.commands, new Commands(this));
        this.mutableData = new MutableObject(this.owner, {}) as any;
    }


    private mutableData: MutableObject<InferData<T>>;
    get data(): InferData<T> {
        return this.mutableData as any;
    }
    set data(value: InferData<T>) {
        this.mutableData = new MutableObject(this.owner, value) as any;
    }

    get children() {
        return this.owner.getChildren(this);
    }

    render() {
        const children = Array.from(this.children.values()).map(child => child.render());
        const component = this.model.component;
        if (component) {
            return createElement(component, {
                key: this.id,
                node: this,
                ref: (el: any) => {
                    this.set("element", el);
                },
            } as any, children);
        }

        return createElement(this.tagName, {
            key: this.id,
            ref: (el) => {
                this.set("element", el);
            }
        }, [
            `Component not found model "${this.model.label || this.model.name}", node id ${this.id}`,
            ...children
        ]);
    }


    append(node: Node<any>, at?: number) {
        return this.owner.addNodeChildren(this, node, at);
    }


    toJSON(): NodeObject {
        if (this.children.size > 0) {
            return {
                id: this.state.id,
                parent: this.state.parent,
                type: this.type,
                tagName: this.tagName,
                data: this.data,
                order: this.order,
                children: Array.from(this.children.values()).map(e => e.toJSON()) as any
            } as any
        }
        return {
            id: this.state.id,
            parent: this.state.parent,
            type: this.type,
            tagName: this.tagName,
            data: this.data,
            order: this.order
        } as any;
    }

    static sort<T extends Node | NodeObject | PlainNodeObject>(nodes: T[]) {
        return nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
}



