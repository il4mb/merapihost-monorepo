import { TypeModel, TypeComponent } from "@/types";
import { FC } from "react";

export const createType = <T>(fc: FC<T & { ref?: React.Ref<HTMLElement> }>, model: TypeModel<T>): TypeComponent<T> => {
    // @ts-ignore
    return Object.assign(fc, { model });
}
