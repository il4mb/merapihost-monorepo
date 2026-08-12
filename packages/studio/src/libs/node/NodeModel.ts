import type { NodeObject } from "@/types";
import { REGISTRY } from ".";
import { ModelProxy } from "./ModelProxy";

export interface NodeContext {
    node: NodeObject | null;
    type: ModelProxy | null;
    dom: HTMLElement | null;
}

export class NodeModel implements NodeContext {

    node: NodeObject | null = null;
    type: ModelProxy | null = null;
    dom: HTMLElement | null = null;

    constructor(node: NodeObject) {
        this.node = node;
        this.type = new ModelProxy(REGISTRY[node.type as string]?.model);
    }

    /**
     * Gets the name of the node.   
     */
    get name() {
        return this.node?.name || this.type.getDefaultName(this);
    }


    get props() {
        return this.node?.props || {};
    }

    get content() {
        return this.node?.content || "";
    }

    get tagName() {
        return this.node?.tagName || "div";
    }
}