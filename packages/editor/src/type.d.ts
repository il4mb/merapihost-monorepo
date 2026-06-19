import { FC, RefObject } from "react";
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

export type RelativeRect = {
    top: number
    left: number
    bottom: number
    right: number
    width: number
    height: number
}

import React from "react";
import { NodeObject } from "@editor/type"; // Adjust import as needed

// 1. Component Props (Strictly NonNullable as requested)
export type ModifierComponentProps<T = any> = {
    nodeIds: string[];
    value: NonNullable<T>;
    onChange: (newValue: T) => void;
};

export type ModifierApplyContext<T = any> = {
    applier: (props: Record<string, any> & { style?: React.CSSProperties }) => void;
    node: NodeObject;
};

// 2. The Modifier Engine Config
export type Modifier<T> = {
    id: string;
    name: string;
    sortName?: string;
    category?: string;
    // Engine might retrieve nothing
    onRetrieve: (props: Record<string, any> & { style?: React.CSSProperties }) => T | null | undefined;
} & (
        | {
            nullable: true;
            defaultValue: T;
            // If nullable, the engine might pass null (e.g., if a global "Clear" button is clicked)
            onApply: (value: T | null, ctx: ModifierApplyContext<T>) => void;
        }
        | {
            nullable?: false;
            // If not nullable, engine guarantees a value
            onApply: (value: NonNullable<T>, ctx: ModifierApplyContext<T>) => void;
        }
    );

// 3. The Combined Export
export type ModifierComponent<T = any> = React.FC<ModifierComponentProps<T>> & {
    modifier: Modifier<T>;
};

export type ModifierSet = {
    modifier: ModifierComponent<any>;
    nodeIds: string[];
};

/**
 * MODEL DEFINITION STRATEGY EXPLAINED:
 * 
 */
// 1. Define the plain object shapes (Remove React.FC from here)
// export type BaseModel<P = any> = {
//     name: string
//     extends?: string
//     props: P
//     related?: Record<string, ModifierComponent>
//     rules?: {
//         canMove?: (node: NodeObject<P>) => boolean
//         canResize?: (node: NodeObject<P>) => boolean
//         canDrag?: (node: NodeObject<P>) => boolean
//         canDrop?: (node: NodeObject<P>, targetNode: NodeObject<P>) => boolean
//     }
// }

// // prettier-ignore
// export type StyledModel<P extends { style?: React.CSSProperties }> = BaseModel<P> & {
//     // styles?: Styles
// }

// // 2. The Conditional Router (Resolves to the correct Model object)
// export type ComponentModel<P = any> = P extends { style?: React.CSSProperties }
//     ? StyledModel<P>
//     : BaseModel<P>;

// // 3. The actual React Component wrapper
// // This states: "A Component is a React Function that also has a .model property"
// export type Component<P = any> = React.FC<P & { ref?: RefObject<HTMLElement> }> & {
//     model: ComponentModel<P>
// }

// export type NodeObject<T = any> = {
//     id: string
//     data: {
//         props?: T
//         type: string
//         name?: string
//         displayName?: string
//         parent: string | null
//         nodes?: string[]
//         linkedNodes?: Record<string, string> // key is elementId in owner, value is linked node id
//     }
//     dom: HTMLElement | null
// }

export type TypeModel<T = any> = {
    name: string
    extends?: string
    icon?: FC<{ size?: number, color?: string }>
    props?: T
    visibleOnTree?: boolean
}
export type TypeComponent<T = any> = React.FC<T> & {
    model: TypeModel<T>
}

export type Block = {
    label: string
    type: string
    icon?: React.ReactNode
    defaultProps?: Record<string, any>
}

export type NodeObject = {
    id: string
    type?: string
    tagName?: string
    name?: string
    props?: Record<string, any>
    parent?: string | null
    order?: number
}

export interface EditorState {
    devices: {
        id: string
        name: string
        width: number | string
        height?: number | string
    }[]
    viewport: {
        scale: number
        width: number
        height: number
        scroll: {
            top: number
            left: number
        }
        rect: {
            top: number
            left: number
            bottom: number
            right: number
        }
    }
    // resolver: Record<string, Component<any>> // Changed from Set to Record for O(1) lookups by name
    nodes: Map<string, NodeObject>
    doms: Map<string, HTMLElement>
    hovered: Set<string>
    selected: Set<string>
    dragged: Set<string>
    device: string
}

export type ActionMap = {
    UPDATE_VIEWPORT: Partial<EditorState["viewport"]>;
    ADD_NODE: NodeObject;
    UPDATE_NODE: {
        id: string
    } & DeepPartial<Omit<NodeObject, "id">>;

    UPDATE_NODE_PROPS: {
        id: string
        props: Record<string, any>
    };

    DELETE_NODE: string;
    SET_NODES: Map<string, NodeObject>;
    SET_DOM: {
        id: string;
        dom: HTMLElement;
    };
    REMOVE_DOM: string;
    ADD_HOVERED: string;
    SET_HOVERED: string;
    REMOVE_HOVERED: string;
    CLEAR_HOVERED: never;

    ADD_SELECTED: string;
    SET_SELECTED: string;
    REMOVE_SELECTED: string;
    CLEAR_SELECTED: never;

    ADD_DRAGGED: string;
    REMOVE_DRAGGED: string;

    SET_DEVICE: string;
}

export type EditorAction = {
    [Key in keyof ActionMap]: [ActionMap[Key]] extends [never]
    ? { type: Key }
    : undefined extends ActionMap[Key]
    ? { type: Key; payload?: ActionMap[Key] }
    : { type: Key; payload: ActionMap[Key] }
}[keyof ActionMap]
