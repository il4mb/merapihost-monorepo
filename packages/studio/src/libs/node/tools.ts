import { TypeModel, TypeComponent, NodeObject } from "@/types";
import { FC, RefObject } from "react";
import { NodeModel } from "./NodeModel";

type FCProps = {
    node: NodeModel;
    children: React.ReactNode;
    ref: RefObject<HTMLElement | null>;
}
type CreateTypeFC<T> = FC<FCProps & T>;

export const createType = <T>(fc: CreateTypeFC<T>, model: TypeModel<T>): TypeComponent<T> => {
    // @ts-ignore
    return Object.assign(fc, { model });
}


export const getNodeModel = <T>(node: NodeObject) => {
    return new NodeModel(node);
}

