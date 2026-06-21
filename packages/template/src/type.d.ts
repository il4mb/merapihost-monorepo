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

export type TypeContext<T> = {
    node: NodeObject<T> | undefined
    dom: HTMLElement | null
    type: TypeComponent<T> | undefined
}
export type TypeModel<T = any> = {
    name: string;
    extends?: string;
    icon?: FC<{ size?: number, color?: string }>;
    color?: string;
    childrenColor?: string;
    visibleOnTree?: boolean;
    default?: {
        name?: string | ((this: TypeContext<T>) => string);
        props?: T;
    }
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

export interface EditorState {
    /**
     * devices is an array of device configurations that the editor can simulate. Each device has an id, name, width, and optional height. This allows users to preview their designs on different screen sizes and orientations, facilitating responsive design testing and development.
     */
    devices: {
        id: string
        name: string
        width: number | string
        height?: number | string
    }[]
    /**
     * viewport contains information about the current viewport state, including scale, dimensions, scroll position, and the visible rectangle. This allows the editor to manage zooming, panning, and rendering optimizations based on what is currently visible to the user.
     */
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
    /**
     * doms is a Map where the key is the nodeId and the value is the corresponding HTMLElement.
     */
    doms: Map<string, HTMLElement>
    /**
     * variables is a Map where the key is the nodeId and the value is another Map of variableName to NodeVariable.
     * This allows us to store multiple variables for each node, and easily retrieve or update them by nodeId and variableName.
     */
    variables: Map<string, Map<string, NodeVariable>>
    /**
     * hovered is a Set of nodeIds that are currently being hovered over in the editor. This can be used to apply specific styles or behaviors to nodes while they are hovered.
     */
    hovered: Set<string>
    /**
     * selected is a Set of nodeIds that are currently selected in the editor. This allows for multiple selection and easy checking of whether a node is selected.
     */
    selected: Set<string>
    /**
     * dragged is a Set of nodeIds that are currently being dragged in the editor. This can be used to apply specific styles or behaviors to nodes while they are being dragged.
     */
    dragged: Set<string>
    /**
     * device represents the currently active device or viewport configuration in the editor. This can be used to apply responsive design settings or to preview the layout on different screen sizes.
     */
    device: string
}

// 1. Define all of your actions EXCEPT BULK here
export type CoreActionMap = {
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

    ADD_VARIABLE: {
        nodeId: string;
        variable: NodeVariable;
    };

    REMOVE_VARIABLE: {
        nodeId: string;
        variableName: string;
    };

    UPDATE_VARIABLE: {
        nodeId: string;
        variable: NodeVariable;
    };

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

export type StrictActionUnion = {
    [K in keyof CoreActionMap]: CoreActionMap[K] extends never
    ? { type: K }
    : { type: K; payload: CoreActionMap[K] };
}[keyof CoreActionMap];

// 3. Create your final ActionMap and strictly type the BULK array
export type ActionMap = CoreActionMap & {
    BULK: StrictActionUnion[];
}

export type EditorAction = {
    [Key in keyof ActionMap]: [ActionMap[Key]] extends [never]
    ? { type: Key }
    : undefined extends ActionMap[Key]
    ? { type: Key; payload?: ActionMap[Key] }
    : { type: Key; payload: ActionMap[Key] }
}[keyof ActionMap]
