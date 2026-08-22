import { Node } from "./node/Node";
import type { Container } from "./Container";
import type { ModelDefinition, ComponentProps, InferData, InferCommand } from "@/types/model";
import type { NodeObject, PlainNodeObject } from "@/types/node";
import type { FC } from "react";
import { Register } from "./Register";

export class Model<T extends ModelName = ModelName> {

    constructor(
        private container: Register,
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

    public isInstance(raw: PlainNodeObject<T>) {
        const hook = this.definition.isInstance || this.extends?.isInstance || (() => false);
        return hook.bind(this)(raw);
    }

    public onCreate(node: Node<T>) {
        const hook = this.definition.onCreate || this.extends?.onCreate || (() => false);
        return hook.bind(this)(node);
    }

    public buildNode(owner: Container, object: PlainNodeObject<T>): Node<T> {
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
        this.onCreate(node);
        return node;
    }

}
