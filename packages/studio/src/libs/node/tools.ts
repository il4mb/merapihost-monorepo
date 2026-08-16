import { TypeModel, TypeComponent, NodeObject } from "@/types";
import { FC, RefObject } from "react";
import { NodeModel } from "./NodeModel";

type FCProps<T = any, P = any> = {
    node: NodeModel<T>;
    children: React.ReactNode;
    childrenNode: NodeModel[];
    ref: RefObject<HTMLElement | null>;
} & P;
type CreateTypeFC<T, P> = FC<FCProps<T, P>>;

export const createType = <T extends Record<string, unknown>, P = {}>(
    fc: CreateTypeFC<T, P>,
    model: TypeModel<T>
): TypeComponent<T> => {
    // @ts-ignore
    return Object.assign(fc, { model });
}


export const getNodeModel = <T extends Record<string, unknown>>(node: NodeObject) => {
    return new NodeModel(node);
}

