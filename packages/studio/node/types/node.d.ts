import type { FC, JSX } from "react";
import type { RegistryKey } from "@nodes/types/type";

export type NodeObject<T extends RegistryKey> = {
    id: string;
    type?: string;
    tagName?: keyof JSX.IntrinsicElements;
    name?: string;
    content?: string;
    data?: DataDefinition<T>;
    parent?: string | null;
    order?: number;
    visible?: boolean;
};

export type PlainNodeObject = Omit<NodeObject<any>, "type" | "id"> & {
    id?: string;
}