import { Node } from "./node/Node";
import type { Document } from "./Document";
import type { ModelDefinition, ComponentProps, InferData, HookDefinition, InferHookArgs, InferCommand } from "@/types/model";
import type { NodeObject, PlainNodeObject } from "@/types/node";
import type { FC } from "react";
import { Container } from "./Container";

export class Model<T extends ModelName = ModelName> {

    constructor(
        private container: Container,
        private definition: ModelDefinition<T>) { }

    get extends() {
        if (this.definition.extends
            && this.container.has(this.definition.extends)
        ) {
            return this.container.get(this.definition.extends as T)
        }
        return null;
    }

    get component(): FC<ComponentProps<T>> | null {
        return this.definition.component || this.extends?.component || null;;
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
