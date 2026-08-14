import { TypeModel, TypeComponent, NodeObject } from "@/types";
import { FC, RefObject } from "react";
import { NodeModel } from "./NodeModel";

type FCProps = {
    node: NodeModel;
    children: React.ReactNode;
    childrenNode: NodeModel[];
    ref: RefObject<HTMLElement | null>;
}
type CreateTypeFC<T> = FC<FCProps & T>;

export const createType = <T extends Record<string, unknown>>(fc: CreateTypeFC<T>, model: TypeModel<T>): TypeComponent<T> => {
    // @ts-ignore
    return Object.assign(fc, { model });
}


export const getNodeModel = <T extends Record<string, unknown>>(node: NodeObject) => {
    return new NodeModel(node);
}

