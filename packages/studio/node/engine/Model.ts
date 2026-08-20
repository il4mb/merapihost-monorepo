import { Node } from "./Node";
import type { NodeObject, TypeModelDefinition, TypeProps } from "@nodes/types";
import { FC } from "react";

export class Model<T extends Record<string, unknown> = Record<string, unknown>> {

    readonly id: string;
    extends: Model<T> | undefined;

    constructor(private definition: TypeModelDefinition<T>) {
        // Assign a unique ID based on the type name
        this.id = String(definition.name).toLowerCase();
    }

    get extendsName(): string | undefined {
        return this.definition.extends;
    }

    get component(): FC<TypeProps<T>> {
        return this.definition.component;
    }

    get isInstance(): (node: NodeObject<any>) => boolean {
        return this.definition.isInstance || (() => false);
    }

    get state(): () => T {
        return this.definition.state || (() => ({} as T));
    }

    get name(): string {
        return this.definition.name;
    }

    get icon(): FC<{ size: number; color: string; node: Node; }> | undefined {
        return this.definition.icon;
    }

    get commands(): Record<string, (props?: any) => void> | undefined {
        return this.definition.commands;
    }

    get default(): Partial<Omit<NodeObject<T>, "id" | "type" | "parent" | "order" | "visible">> | undefined {
        return this.definition.default;
    }


    buildNode(owner: any, data: NodeObject<T>): Node {

        const node = new Node(owner, this);
        if (data?.id) {
            node.id = data.id;
        }
        if (data?.tagName) {
            node.tagName = data.tagName;
        }
        if (data?.order !== undefined) {
            node.order = data.order;
        }
        if (data?.parent !== undefined) {
            node.parent = owner.findNode(data.parent) || null;
        }
        if (data?.props) {
            node.props = { ...this.state(), ...data.props };
        } else {
            node.props = {};
        }


        return node;
    }

}