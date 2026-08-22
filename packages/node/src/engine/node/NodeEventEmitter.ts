import { nanoid } from "nanoid";
import { JSX } from "react/jsx-runtime";
import { Container } from "../Container";
import { EventEmitter } from "../EventEmitter";
import { Node } from "./Node";
import { NodeState } from "@/types";


type NodeInternalEventMap = {
    hover: (hovered: boolean) => void;
    select: (selected: boolean) => void;
    reorder: () => void;

    mounted: (element: HTMLElement) => void;
    unmounted: (element: HTMLElement) => void;

    childAttached: (child: Node) => void;
    childDetached: (child: Node) => void;

    parentAttached: (parent: Node) => void;
    parentDetached: (parent: Node) => void;

    option: (updated: NodeState['option'], old: NodeState['option']) => void
};

export class NodeEventEmitter extends EventEmitter<NodeInternalEventMap> {

    protected state: NodeState = {
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

    constructor(public owner: Container) { super(); }

    protected set<K extends keyof NodeState>(key: K, next: NodeState[K]) {
        const previous = this.state[key];
        this.state[key] = next;

        if (previous === next) return false;

        switch (key) {
            case "element": {
                this.trigger(next ? "mounted" : "unmounted", next || previous as any);
                return true;
            }
            case "order": {
                this.trigger("reorder");
                return true;
            }
            case "hovered": {
                this.trigger("hover", Boolean(next));
                return true;
            }
            case "selected": {
                this.trigger("select", Boolean(next));
                return true;
            }

            case "parent": {
                this.updateParent(
                    previous as string | null,
                    next as string | null
                );
                return true;
            }
            case "option": {
                // @ts-ignore
                this.trigger("option", next, previous);
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



