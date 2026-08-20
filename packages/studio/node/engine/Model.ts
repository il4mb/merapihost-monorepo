import { Node } from "./Node";
import { Document } from "./Document";
import type { ModelDefinition, ComponentProps, CommandDefinition, RegistryKey } from "@nodes/types/type";
import type { NodeObject, PlainNodeObject } from "@nodes/types/node";
import { nanoid } from "nanoid";
import { FC } from "react";
import { NodeProxy } from "./NodeProxy";

export class Model<
    P extends Record<string, unknown> = {},
    C extends CommandDefinition<any> = CommandDefinition<any>,
> {

    extends: Model<P, C> | undefined;

    constructor(private definition: ModelDefinition<any, P, C>) {
        // Assign a unique ID based on the type name

    }

    get extendsName(): string | undefined {
        return this.definition.extends;
    }

    get component(): FC<ComponentProps<RegistryKey>> {
        return this.definition.component as unknown as FC<ComponentProps<RegistryKey>>;
    }

    get isInstance(): (node: NodeObject<any>) => boolean {
        return this.definition.isInstance || (() => false);
    }

    get onCreate(): (node: Node<RegistryKey, P, C>) => void {
        return this.definition.onCreate || (() => { });
    }

    get onMount(): (node: Node<RegistryKey, P, C>) => void {
        return this.definition.onMount || (() => { });
    }

    get onUnmount(): (node: Node<RegistryKey, P, C>) => void {
        return this.definition.onUnmount || (() => { });
    }

    get state(): () => P {
        return this.definition.state || (() => ({} as P));
    }

    get name(): string {
        return this.definition.name as string;
    }

    get label(): string {
        return this.definition.label || this.definition.name as unknown as string;
    }

    get icon(): FC<{ size: number; color: string; node: Node<RegistryKey, P, C>; }> | undefined {
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

    buildNode(owner: Document, data: PlainNodeObject): Node<any, P, C> {

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

        const proxyNode = new Proxy(node, new NodeProxy(this, node)) as Node<any, P, C>;
        this.onCreate(proxyNode);
        return proxyNode;
    }

}
