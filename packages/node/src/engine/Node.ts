import { nanoid } from "nanoid";
import type { Model } from "./Model";
import { JSX } from "react/jsx-runtime";
import { InferCommand, InferData } from "@/types/model";
import { Commands } from "./Commands";
import { MutableObject } from "./MutableObject";
import { NodeObject, PlainNodeObject } from "@/types/node";
import { Document } from "./Document";
import { createElement, createRef, RefObject } from "react";

export class Node<T extends ModelName = ModelName> {

    private _id = nanoid();
    private parentId: string | null = null;

    readonly commands: InferCommand<T, false>;
    readonly type: T;

    readonly elementRef: RefObject<Element> = createRef();
    tagName: keyof JSX.IntrinsicElements = "div";
    order: number = 0;

    selectable: boolean = true;
    hoverable: boolean = true;
    resizeable: boolean = true;

    constructor(readonly owner: Document, readonly model: Model<T>,) {
        this._id = nanoid();
        this.parentId = null;
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

    get id(): string {
        return this._id;
    }

    set id(value: string) {
        this._id = value;
    }

    get parent() {
        return this.owner.findNode(this.parentId);
    }

    set parent(value: Node<any> | null) {
        if (value && value.owner !== this.owner) {
            throw new Error("Canot set parent with difrent owner");
        }
        this.parentId = value.id;
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
                ref: (el) => {
                    this.elementRef.current = el;
                    this.model.invokeHook("onMount", this);
                },
            } as any, children);
        }

        return createElement(this.tagName, {
            key: this.id,
            ref: (el) => {
                this.elementRef.current = el;
                this.model.invokeHook("onMount", this);
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
                id: this._id,
                parent: this.parentId,
                type: this.type,
                tagName: this.tagName,
                data: this.data,
                order: this.order,
                children: Array.from(this.children.values()).map(e => e.toJSON()) as any
            } as any
        }
        return {
            id: this._id,
            parent: this.parentId,
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