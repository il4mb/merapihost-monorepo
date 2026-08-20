import type { FC, JSX } from "react";
import type { Node } from "@nodes/engine/Node";
import type { TypeRegistry } from "@nodes/registry";
import type { Model } from "@nodes/engine/Model";
import type { NodeObject, PlainNodeObject, GetNode } from "@nodes/types/node";

export type RegistryKey = keyof TypeRegistry;
export type GetModel<T extends RegistryKey> = TypeRegistry[T] extends Model<infer P, infer C>
    ? Model<P, C>
    : never;

export type InferProps<T extends RegistryKey> = GetModel<T> extends Model<infer P, infer C>
    ? P
    : never;

export type InferCommands<T extends RegistryKey> = GetModel<T> extends Model<infer P, infer C>
    ? C
    : never;

export type ComponentProps<T extends RegistryKey> = {
    node: GetNode<T>;
    children: React.ReactNode;
    childrenNode: Node[];
    ref: React.RefObject<HTMLElement | null>;
}


export type Command<T extends RegistryKey, Args extends any[] = any[]> = (this: GetNode<T>, ...args: Args) => void;
export type CommandDefinition<T extends RegistryKey> = Record<string, Command<T, any[]>>;

export interface ModelDefinition<
    T extends RegistryKey,
    P extends Record<string, unknown> = {},
    C extends CommandDefinition<T> = CommandDefinition<T>
> {

    /**
    * The unique name of the type. This is used to identify the type in the registry.
    * It should be a lowercase string without spaces or special characters.
    * This name is used as the key in the TypeRegistry.
    * @example "button", "text", "image"
    */
    name: T;

    /**
     * A human-readable label for the type. This is used in the UI to represent the type.
     * If not provided, the name will be used as the label.
     */
    label?: string;

    /**
     * The name of the type that this type extends.
     */
    extends?: string;

    /**
     * The icon component that will be used to represent this type in the UI.
     */
    icon?: FC<{ size: number; color: string; node: Node }>;

    /**
     * A map of command functions that can be invoked on this type.
     */
    commands?: C;

    default?: Partial<
        Omit<NodeObject<P>, "id" | "type" | "parent" | "order" | "visible">
    >;


    /**
     * The React component that will be used to render this type.
     */
    component: FC<ComponentProps<T>>;

    /**
     * Determine if a given node is an instance of this type.
     * This method are called when the node is at initialization.
     * @param node The plain object to check.
     * @returns A boolean indicating if the node is an instance of this type.
     */
    isInstance?: (node: PlainNodeObject) => boolean;

    /**
     * Called when the node is created.
     * This method is called when the node is added to the document.
     * @param node The node that is being created.
     */
    onCreate?: (node: Node<T, P, C>) => void;


    /**
     * Called when the node is mounted to the DOM.
     * This method is called when the node is added to the document.
     * @param node The node that is being mounted.
     */
    onMount?: (node: Node<T, P, C>) => void;

    /**
     * Called when the node is unmounted from the DOM.
     * This method is called when the node is removed from the document.
     * @param node The node that is being unmounted.
     */
    onUnmount?: (node: Node<T, P, C>) => void;


    /**
     * Special function to manipulate the props of the node before it is rendered.
     * @returns An object representing the initial state of the node.
     */
    state?: () => P;


}

