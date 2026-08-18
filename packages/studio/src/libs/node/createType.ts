import type { NodeModel, TypeComponent, TypeModel } from "@/types";
import type { FC, RefObject } from "react";

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