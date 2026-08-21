import { Node } from "./Node";
import type { Document } from "./Document";
import type { ModelDefinition, ComponentProps, RegistryKey, DataDefinition, ModelHookDefinition, InferModelHookArgs, CommandDefinition } from "@nodes/types/type";
import type { NodeObject, PlainNodeObject } from "@nodes/types/node";
import type { FC } from "react";

export class Model<T extends RegistryKey = RegistryKey> {

    // do not assign, it will be assigned by registry when the model is registered
    readonly extends: Model<T>;

    constructor(private definition: ModelDefinition<T>) { }

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

    get commands(): CommandDefinition<T> {
        return this.definition.commands as CommandDefinition<T>;
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
