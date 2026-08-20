import type { FC, JSX } from "react";
import type { Node } from "@nodes/engine/Node";
import type { TypeRegistry } from "@nodes/registry";
import type { Model } from "@nodes/engine/Model";
import type { NodeObject, PlainNodeObject } from "@nodes/types/node";

export type RegistryKey = keyof TypeRegistry;

export type ComponentProps<T extends RegistryKey> = {
    node: Node<T>;
    children: React.ReactNode;
    childrenNode: Node[];
    ref: React.RefObject<HTMLElement | null>;
}

export type CommandDefinition<T extends RegistryKey> = TypeRegistry[T] extends { commands: infer C }
    ? {
        [K in keyof C]: C[K] extends (this: any, ...args: infer Args) => infer R
        ? (this: Node<T>, ...args: Args) => R
        : (this: Node<T>, ...args: any[]) => void;
    }
    : Record<string, (this: Node<T>, ...args: any[]) => void>;

export type DataDefinition<T extends RegistryKey> = TypeRegistry[T] extends { data: infer D }
    ? D
    : Record<string, unknown>;

export interface ModelDefinition<
    T extends RegistryKey,
    D extends DataDefinition<T> = DataDefinition<T>,
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
    commands?: CommandDefinition<T>;

    default?: Partial<
        Omit<NodeObject<DataDefinition<T>>, "id" | "type" | "parent" | "order" | "visible">
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
    onCreate?: (this: Model<T>, node: Node<T>) => void;


    /**
     * Called when the node is mounted to the DOM.
     * This method is called when the node is added to the document.
     * @param node The node that is being mounted.
     */
    onMount?: (node: Node<T>) => void;

    /**
     * Called when the node is unmounted from the DOM.
     * This method is called when the node is removed from the document.
     * @param node The node that is being unmounted.
     */
    onUnmount?: (node: Node<T>) => void;


    /**
     * Special function to manipulate the props of the node before it is rendered.
     * @returns An object representing the initial state of the node.
     */
    state?: () => D;


}

