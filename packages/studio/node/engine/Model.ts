import { Node } from "./Node";
import { Document } from "./Document";
import type { ModelDefinition, ComponentProps, RegistryKey, DataDefinition } from "@nodes/types/type";
import type { NodeObject, PlainNodeObject } from "@nodes/types/node";
import { FC } from "react";
import { TypeRegistry } from "@nodes/registry";
import { LifecycleHook } from "./LifecyleHook";
import { NodeFiber } from "./NodeFiber";


export type ModelCommands<T extends RegistryKey> = TypeRegistry[T] extends { commands: infer C }
    ? {
        [K in keyof C]: C[K] extends (...args: infer Args) => infer R
        ? (...args: Args) => R
        : (...args: any[]) => void;
    }
    : Record<string, (...args: any[]) => void>;




export class Model<T extends RegistryKey = RegistryKey> extends LifecycleHook {

    // do not assign, it will be assigned by registry when the model is registered
    readonly extends: Model<T>;
    
    constructor(private definition: ModelDefinition<T>) {
        super();
    }

    get component(): FC<ComponentProps<RegistryKey>> {
        return this.definition.component as unknown as FC<ComponentProps<RegistryKey>>;
    }

    get isInstance(): (node: NodeObject<any>) => boolean {
        return this.definition.isInstance || (() => false);
    }

    get onCreate(): (node: Node<RegistryKey>) => void {
        return this.definition.onCreate || (() => { });
    }

    get onMount(): (node: Node<RegistryKey>) => void {
        return this.definition.onMount || (() => { });
    }

    get onUnmount(): (node: Node<RegistryKey>) => void {
        return this.definition.onUnmount || (() => { });
    }

    get name(): string {
        return this.definition.name as string;
    }

    get label(): string {
        return this.definition.label || this.definition.name as unknown as string;
    }

    get icon(): FC<{ size: number; color: string; node: Node<RegistryKey>; }> | undefined {
        return this.definition.icon;
    }

    get commands(): ModelCommands<T> {
        return this.definition.commands as ModelCommands<T>;
    }

    get default(): Partial<Omit<NodeObject<T>, "id" | "type" | "parent" | "order" | "visible">> | undefined {
        return this.definition.default;
    }

    buildNode(owner: Document, data: PlainNodeObject): Node<RegistryKey> {

        const node = new Node(owner, this);

        // Create fiber for the node and store it in the fibers map
        // this is important for lifecycle management and tracking the state of the node
        this.fibers.set(node.id, new NodeFiber(node));

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
        if (data?.data) {
            node.data = { ...data.data };
        } else {
            node.data = {} as DataDefinition<T>;
        }

        // const proxyNode = new Proxy(node, new NodeProxy(node, () => this.triggerEffects())) as Node<T>;
        // this.onCreate(proxyNode);
        this.onCreate(node);
        return node;
    }

}
