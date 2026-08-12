import type { NodeObject } from "@/types";
import { ElementNode, REGISTRY } from ".";
import { ModelProxy } from "./ModelProxy";
import { merge } from "lodash";

export interface NodeContext {
    node: NodeObject | null;
    type: ModelProxy | null;
    dom: HTMLElement | null;
}

export class NodeModel implements NodeContext {

    readonly node: NodeObject;
    readonly type: ModelProxy;
    private _dom: HTMLElement | null = null;

    private findType(node: NodeObject): ModelProxy {
        if ("type" in node && node.type && node.type in REGISTRY) {
            return new ModelProxy(REGISTRY[node.type]);
        }
        const match = Object.values(REGISTRY).find(
            (item) => item.model.isInstance?.(node)
        );
        return match ? new ModelProxy(match) : new ModelProxy(ElementNode);
    }

    private mergeDefaultProps() {
        const typeDefaultProps = this.type.getDefaultProps(this);
        const mergedProps = merge({}, typeDefaultProps, this.node.props || {});
        this.node.props = mergedProps;
    }

    constructor(node: NodeObject | NodeModel) {
        if (node instanceof NodeModel) {
            // existing NodeModel
            this.node = node.node;
            this.type = node.type;
            this.dom = node.dom;
        } else {
            // new NodeModel
            this.node = node;
            this.type = this.findType(node);

            // Merge default props for new nodes only, not for existing NodeModel instances
            this.mergeDefaultProps();
        }
    }

    get id() {
        return this.node.id;
    }

    get dom() {
        return this._dom;
    }
    set dom(value: HTMLElement | null) {
        this._dom = value;
    }

    /**
     * Gets the name of the node.   
     */
    get name() {
        return this.node?.name || this.type.getDefaultName(this);
    }
    set name(value: string) {
        this.node.name = value;
    }


    get props() {
        return this.node?.props || {};
    }
    set props(value: Record<string, any>) {
        this.node.props = value;
    }


    get content() {
        return this.node?.content || undefined;
    }
    set content(value: string) {
        this.node.content = value;
    }


    get tagName() {
        return this.node?.tagName || "div";
    }
    set tagName(value: string) {
        this.node.tagName = value;
    }


    get parent(): string | null {
        return this.node?.parent || null;
    }
    set parent(value: string | null) {
        this.node.parent = value;
    }


    get order(): number {
        return this.node?.order || 0;
    }
    set order(value: number) {
        this.node.order = value;
    }


    get visible(): boolean {
        return this.node?.visible ?? true;
    }
    set visible(value: boolean) {
        this.node.visible = value;
    }
}