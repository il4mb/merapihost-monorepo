import type { FC, JSX } from "react";
import type { DataDefinition } from "@/types/type";

export type NodeObject<T extends ModelName = ModelName> = {
    id: string;
    type?: T;
    tagName?: keyof JSX.IntrinsicElements;
    name?: string;
    content?: string;
    data?: Partial<DataDefinition<T>>;
    parent?: string | null;
    order?: number;
    visible?: boolean;
    children?: NodeObject<ModelName>;
};

export type PlainNodeObject<T extends ModelName = ModelName> = Omit<NodeObject<T>, "type" | "id"> & {
    id?: string;
}