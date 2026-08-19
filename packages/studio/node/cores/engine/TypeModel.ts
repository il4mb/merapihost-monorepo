import { NodeObject, TypeModelDefinition, TypeProps, NodeModel } from "@nodes";
import { FC } from "react";

export class TypeModel<
    T extends Record<string, unknown> = Record<string, unknown>
> implements TypeModelDefinition<T> {


    constructor(private definition: TypeModelDefinition<T>) { }

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

    get extends(): string | undefined {
        return this.definition.extends;
    }

    get icon(): FC<{ size: number; color: string; node: NodeModel; }> | undefined {
        return this.definition.icon;
    }

    get commands(): Record<string, (props?: any) => void> | undefined {
        return this.definition.commands;
    }

    get default(): Partial<Omit<NodeObject<T>, "id" | "type" | "parent" | "order" | "visible">> | undefined {
        return this.definition.default;
    }

}