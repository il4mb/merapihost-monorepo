import type { FC, JSX } from "react";
import type { InferData } from "@/types";

export type NodeObject<T extends ModelName = ModelName> = {
    id: string;
    type?: T;
    tagName?: keyof JSX.IntrinsicElements;
    name?: string;
    content?: string;
    data?: Partial<InferData<T>>;
    parent?: string | null;
    order?: number;
    visible?: boolean;
    children?: NodeObject<T>[];
};

export type PlainNodeObject<T extends ModelName = ModelName> = Omit<NodeObject<T>, "type" | "id"> & {
    id?: string;
}

export type NodeState = {
    id: string;
    parent: string | null;
    tagName: keyof JSX.IntrinsicElements;
    order: number;
    element: Element | null;
    option: {
        selectable: boolean
        hoverable: boolean
        resizeable: boolean
    }
    selected: boolean
    hovered: boolean
}