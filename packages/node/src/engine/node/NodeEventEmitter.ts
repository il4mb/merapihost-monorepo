import { nanoid } from "nanoid";
import { JSX } from "react/jsx-runtime";
import { Document } from "../Document";
import { EventEmitter } from "../EventEmitter";
import { Node } from "./Node";

type State = {
    id: string;
    parent: string | null;
    tagName: keyof JSX.IntrinsicElements;
    order: number;
    element: Element | null;
    option: {
        selectable: boolean
        hoverable: boolean
        resizeable: boolean
    }
    selected: boolean
    hovered: boolean
}

type NodeEventMap = {
    hovered: () => void;
    unhovered: () => void;
    reorder: () => void;
    selected: () => void;
    unselected: () => void;
    mounted: (element: HTMLElement) => void;
    unmounted: () => void;
    childAttached: (child: Node) => void;
    childDetached: (child: Node) => void;

    parentAttached: (parent: Node) => void;
    parentDetached: (parent: Node) => void;
};

export class NodeEventEmitter extends EventEmitter<NodeEventMap> {

    protected state: State = {
        id: nanoid(),
        parent: null,
        tagName: "div",
        element: null,
        order: 0,
        selected: false,
        hovered: false,
        option: {
            selectable: true,
            hoverable: true,
            resizeable: true,
        }
    }

    get id(): string {
        return this.state.id;
    }
    set id(value: string) {
        this.state.id = value;
    }

    get parent() {
        return this.owner.findNode(this.state.parent);
    }
    set parent(value: Node<any> | null) {
        if (value && value.owner !== this.owner) {
            throw new Error("Canot set parent with difrent owner");
        }
        this.set("parent", value.id);
    }


    get tagName() {
        return this.state.tagName;
    }
    set tagName(value: keyof JSX.IntrinsicElements) {
        this.set("tagName", value);
    }


    get element() {
        return this.state.element as Element | null;
    }
    set element(element: Element | null) {
        this.set("element", element);
    }


    get order() {
        return this.state.order || 0;
    }
    set order(value: number) {
        this.set("order", value);
    }


    get selectable() {
        return this.state.option.selectable;
    }
    set selectable(value: boolean) {
        this.set("option", { ...this.state.option, selectable: value });
    }


    get hoverable() {
        return this.state.option.hoverable;
    }
    set hoverable(value: boolean) {
        this.set("option", { ...this.state.option, hoverable: value });
    }


    get resizeable() {
        return this.state.option.resizeable;
    }
    set resizeable(value: boolean) {
        this.set("option", { ...this.state.option, resizeable: value });
    }

    constructor(public owner: Document) { super(); }

    protected set<K extends keyof State>(key: K, value: State[K]) {
        const previous = this.state[key];
        this.state[key] = value;

        switch (key) {
            case "element": {
                this.trigger(value ? "mounted" : "unmounted");
                this.state[key] = value;
                return true;
            }
            case "order": {
                this.state[key] = value;
                this.trigger("reorder");
                return true;
            }
            case "hovered": {
                this.state[key] = value;
                this.trigger(value ? "hovered" : "unhovered");
                return true;
            }
            case "selected": {
                this.state[key] = value;
                this.trigger(value ? "selected" : "unselected");
                return true;
            }

            case "parent": {
                this.updateParent(
                    previous as string | null,
                    value as string | null
                );
                return true;
            }
        }

        return false;
    }

    private updateParent(previous: string | null, next: string | null) {
        if (previous === next) return;

        const oldParent = this.owner.findNode(previous);
        const newParent = this.owner.findNode(next);

        if (oldParent) {
            oldParent.trigger(
                "childDetached",
                this as unknown as Node<any>
            );

            this.trigger(
                "parentDetached",
                oldParent as unknown as Node<any>
            );
        }

        if (newParent) {
            newParent.trigger(
                "childAttached",
                this as unknown as Node<any>
            );

            this.trigger(
                "parentAttached",
                newParent as unknown as Node<any>
            );
        }
    }
}



