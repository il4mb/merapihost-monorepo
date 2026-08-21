import { Node } from "./Node";
import type { Document } from "./Document";
import type { ModelDefinition, ComponentProps, RegistryKey, DataDefinition, ModelHookDefinition, InferModelHookArgs } from "@nodes/types/type";
import type { NodeObject, PlainNodeObject } from "@nodes/types/node";
import type { FC } from "react";
import type { TypeRegistry } from "@nodes/registry";

export type ModelCommands<T extends RegistryKey> = TypeRegistry[T] extends { commands: infer C }
    ? {
        [K in keyof C]: C[K] extends (...args: infer Args) => infer R
        ? (...args: Args) => R
        : (...args: any[]) => void;
    }
    : Record<string, (...args: any[]) => void>;




export class Model<T extends RegistryKey = RegistryKey> {

    // do not assign, it will be assigned by registry when the model is registered
    readonly extends: Model<T>;

    constructor(private definition: ModelDefinition<T>) {
        // super();
    }

    get component(): FC<ComponentProps<T>> {
        return this.definition.component as unknown as FC<ComponentProps<T>>;
    }

    get name(): string {
        return this.definition.name as string;
    }

    get label(): string {
        return this.definition.label || this.definition.name as unknown as string;
    }

    get icon(): FC<{ size: number; color: string; node: Node<T>; }> | undefined {
        return this.definition.icon;
    }

    get commands(): ModelCommands<T> {
        return this.definition.commands as ModelCommands<T>;
    }

    get default(): Partial<Omit<NodeObject<T>, "id" | "type" | "parent" | "order" | "visible">> | undefined {
        return this.definition.default as any;
    }

    public invokeHook<N extends keyof ModelHookDefinition<T>>(
        name: N,
        ...args: InferModelHookArgs<N, T>
    ) {
        const hook = this.definition[name];
        if (typeof hook === 'function') {
            return (hook as Function).apply(this, args);
        }
    }

    public buildNode(owner: Document, object: PlainNodeObject<T>): Node<T> {
        const node = new Node<T>(owner, this);
        if (object?.id) node.id = object.id;

        if (object?.tagName) {
            node.tagName = object.tagName;
        } else if (this.default?.tagName) {
            node.tagName = this.default.tagName;
        }
        if (object?.order !== undefined) {
            node.order = object.order;
        }
        if (object?.data) {
            node.data = {
                ...(this.default?.data as any),
                ...(object.data as any)
            } as DataDefinition<T>;
        } else {
            node.data = {
                ...(this.default?.data as any)
            };
        }
        return node;
    }

}
