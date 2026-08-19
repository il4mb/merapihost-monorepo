import type { FC } from "react";
import { NodeModel } from "@nodes";

export type TypeProps<T> = {
    node: NodeModel<T>;
    children: React.ReactNode;
    childrenNode: NodeModel[];
    ref: React.RefObject<HTMLElement | null>;
}



export interface TypeModelDefinition<Props extends Record<string, unknown> = Record<string, unknown>> {
    /**
     * The React component that will be used to render this type.
     */
    component: FC<TypeProps<Props>>;

    /**
     * Determine if a given node is an instance of this type.
     * This method are called when the node is at initialization.
     * @param node The plain object to check.
     * @returns A boolean indicating if the node is an instance of this type.
     */
    isInstance?: (node: NodeObject<any>) => boolean;

    /**
     * Special function to manipulate the props of the node before it is rendered.
     * @returns An object representing the initial state of the node.
     */
    state?: () => Props;

    /**
     * The name of the type.
     */
    name: string;

    /**
     * The name of the type that this type extends.
     */
    extends?: string;

    /**
     * The icon component that will be used to represent this type in the UI.
     */
    icon?: FC<{ size: number; color: string; node: NodeModel }>;

    /**
     * A map of command functions that can be invoked on this type.
     */
    commands?: Record<string, (props?: any) => void>;
    
    default?: Partial<
        Omit<NodeObject<Props>, "id" | "type" | "parent" | "order" | "visible">
    >;
}




export type NodeObject<Props extends Record<string, unknown> = Record<string, unknown>> = {
    id: string;
    type?: string;
    tagName?: string;
    name?: string;
    content?: string;
    props?: Props;
    parent?: string | null;
    order?: number;
    visible?: boolean;
};