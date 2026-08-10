import { TypeModel, TypeComponent, NodeObject } from "@/types";
import { FC } from "react";

type FCProps = {
    node: NodeObject;
    children: React.ReactNode;
    ref: React.Ref<HTMLElement | null>;
}
type CreateTypeFC = FC<FCProps>;

export const createType = <T>(fc: CreateTypeFC, model: TypeModel<T>): TypeComponent<T> => {
    // @ts-ignore
    return Object.assign(fc, { model });
}