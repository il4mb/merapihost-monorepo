import type { FC, JSX } from "react";
import type { Node } from "@nodes/engine/Node";
import type { TypeRegistry } from "@nodes/registry";
import type { Model } from "@nodes/engine/Model";
import type { GetModel } from "@nodes/types/type";


export type GetNode<T extends RegistryKey> = GetModel<T> extends Model<T, infer P, infer C>
    ? Node<T, P, C>
    : Node;

export type NodeObject<P extends Record<string, unknown> = Record<string, unknown>> = {
    id: string;
    type?: string;
    tagName?: keyof JSX.IntrinsicElements;
    name?: string;
    content?: string;
    props?: P;
    parent?: string | null;
    order?: number;
    visible?: boolean;
};

export type PlainNodeObject = Omit<NodeObject<any>, "type" | "id"> & {
    id?: string;
}