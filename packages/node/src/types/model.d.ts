import type { FC, JSX } from "react";
import type { Node } from "@/engine/Node";
import type { Model } from "@/engine/Model";
import type { NodeObject, PlainNodeObject } from "@/types/node";

export type ComponentProps<T extends ModelName, E extends Element = Element> = {
    node: Node<T>;
    children: React.ReactNode;
    ref: React.RefObject<E | null>; // Uses the specific element type passed
}


export type InferCommand<
    T extends ModelName,
    WithThis extends boolean = true
> = ModelRegistry[T] extends { commands: infer C }
    ? {
        [K in keyof C]: C[K] extends (this: any, ...args: infer Args) => infer R
        ? WithThis extends true ? (this: Node<T>, ...args: Args) => R : (...args: Args) => R
        : WithThis extends true ? (this: Node<T>, ...args: any[]) => void : (...args: any[]) => void;
    }
    : Record<string, (this: Node<T>, ...args: any[]) => void>;

export type InferData<T extends ModelName> = ModelRegistry[T] extends { data: infer D }
    ? D
    : Record<string, unknown>;


export interface HookDefinition<T extends ModelName> {
    /**
    * Determine if a given node is an instance of this type.
    * This method are called when the node is at initialization.
    * @param node The plain object to check.
    * @returns A boolean indicating if the node is an instance of this type.
    */
    isInstance?: (this: Model<T>, node: PlainNodeObject<T>) => boolean;

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
    onMount?: (this: Model<T>, node: Node<T>) => void;

    /**
     * Called when the node is unmounted from the DOM.
     * This method is called when the node is removed from the document.
     * @param node The node that is being unmounted.
     */
    onUnmount?: (this: Model<T>, node: Node<T>) => void;


    onChildAdd?: (this: Model<T>, child: Omit<Node<any>, "parent"> & { parent: Node<T> }) => void;

    /**
     * Special function to manipulate the props of the node before it is rendered.
     * @returns An object representing the initial state of the node.
     */
    state?: () => D;
}

export type InferHookArgs<
    K extends keyof HookDefinition<any>,
    T extends ModelName = any
> = HookDefinition<T>[K] extends (...args: infer Args) => any ? Args : never;


export interface ModelDefinition<
    T extends ModelName,
    D extends InferData<T> = InferData<T>,
    C extends InferCommand<T> = InferCommand<T>
> extends HookDefinition<T> {

    /**
    * The unique name of the type. This is used to identify the type in the registry.
    * It should be a lowercase string without spaces or special characters.
    * This name is used as the key in the ModelRegistry.
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
    commands?: InferCommand<T>;

    default?: Partial<
        Omit<NodeObject<T>, "id" | "type" | "parent" | "order" | "visible">
    >;


    /**
     * The React component that will be used to render this type.
     */
    component?: FC<ComponentProps<T>>;

}

