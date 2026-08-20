import { Node } from "./Node";
import { Document } from "./Document";
import type { ModelDefinition, ComponentProps, CommandDefinition, RegistryKey } from "@nodes/types/type";
import type { NodeObject, PlainNodeObject } from "@nodes/types/node";
import { nanoid } from "nanoid";
import { FC } from "react";

export class Model<
    T extends RegistryKey,
    P extends Record<string, unknown> = {},
    C extends CommandDefinition<T> = CommandDefinition<T>
> {

    extends: Model<T, P> | undefined;

    constructor(private definition: ModelDefinition<T, P, C>) {
        // Assign a unique ID based on the type name

    }

    get extendsName(): string | undefined {
        return this.definition.extends;
    }

    get component(): FC<ComponentProps<T>> {
        return this.definition.component as unknown as FC<ComponentProps<T>>;
    }

    get isInstance(): (node: NodeObject<any>) => boolean {
        return this.definition.isInstance || (() => false);
    }

    get onCreate(): (node: Node<T, P, C>) => void {
        return this.definition.onCreate || (() => { });
    }

    get onMount(): (node: Node<T, P, C>) => void {
        return this.definition.onMount || (() => { });
    }

    get onUnmount(): (node: Node<T, P, C>) => void {
        return this.definition.onUnmount || (() => { });
    }

    get state(): () => P {
        return this.definition.state || (() => ({} as P));
    }

    get name(): T {
        return this.definition.name as T;
    }

    get label(): string {
        return this.definition.label || this.definition.name as unknown as string;
    }

    get icon(): FC<{ size: number; color: string; node: Node<T, P, C>; }> | undefined {
        return this.definition.icon;
    }

    get commands(): C {
        return this.definition.commands as C;
    }

    get default(): Partial<Omit<NodeObject<P>, "id" | "type" | "parent" | "order" | "visible">> | undefined {
        return this.definition.default;
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

    buildNode(owner: Document, data: PlainNodeObject): Node<T, P, C> {

        const node = new Node(owner, this);
        if (data?.id) {
            node.id = data.id;
        }
        if (data?.tagName) {
            node.tagName = data.tagName;
        } else if (this.default?.tagName) {
            node.tagName = this.default.tagName;
        }
        if (data?.order !== undefined) {
            node.order = data.order;
        }
        if (data?.props) {
            node.props = { ...this.state(), ...data.props };
        } else {
            node.props = {} as P;
        }

        const proxyNode = new Proxy(node, new NodeProxy(this, node)) as Node<T, P, C>;
        this.onCreate(proxyNode);
        return proxyNode;
    }

}

class NodeProxy {
    constructor(private model: Model<any, any, any>, private node: Node<any, any, any>) { }

    get(target: any, prop: string) {
        if (prop in target) {
            return target[prop];
        }
        if (prop in this.node.props) {
            return this.node.props[prop as keyof typeof this.node.props];
        }
        return undefined;
    }

    set(target: any, prop: string, value: any) {
        if (prop in target) {
            target[prop] = value;
            return true;
        }
        if (prop in this.node.props) {
            this.node.props[prop as keyof typeof this.node.props] = value;
            return true;
        }
        return false;
    }
}