import type { FC, JSX } from "react";
import type { RegistryKey, DataDefinition } from "@nodes/types/type";

export type NodeObject<T extends RegistryKey = RegistryKey> = {
    id: string;
    type?: T;
    tagName?: keyof JSX.IntrinsicElements;
    name?: string;
    content?: string;
    data?: Partial<DataDefinition<T>>;
    parent?: string | null;
    order?: number;
    visible?: boolean;
};

export type PlainNodeObject<T extends RegistryKey> = Omit<NodeObject<T>, "type" | "id"> & {
    id?: string;
}