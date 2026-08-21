import { Node } from "./Node";
import type { Document } from "./Document";
import type { ModelDefinition, ComponentProps, InferData, HookDefinition, InferHookArgs, InferCommand } from "@/types/model";
import type { NodeObject, PlainNodeObject } from "@/types/node";
import type { FC } from "react";

export class Model<T extends ModelName = ModelName> {

    // do not assign, it will be assigned by registry when the model is registered
    readonly extends: Model<T>;

    constructor(private definition: ModelDefinition<T>) { }

    get extendsName() {
        return this.definition.extends;
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

    get commands(): InferCommand<T> {
        return this.definition.commands as InferCommand<T>;
    }

    get default(): Partial<Omit<NodeObject<T>, "id" | "type" | "parent" | "order" | "visible">> | undefined {
        return this.definition.default as any;
    }

    public invokeHook<N extends keyof HookDefinition<T>>(
        name: N,
        ...args: InferHookArgs<N, T>
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
            } as InferData<T>;
        } else {
            node.data = {
                ...(this.default?.data as any)
            };
        }
        return node;
    }

}
