import React from "react";
import { FC, RefObject } from "react";
import { AssetObject } from "./asset";
import type { NodeContext, NodeModel, NodeObject, NodeVariable, ModelContext } from "@/libs/node";
import { SxProps } from "@mui/material";

export interface ShortcutHandler {
    /** List of keys required to trigger the action (e.g. ["Control", "s"]) */
    keys: string[];
    /** Callback executed when shortcut matches */
    action: (event: KeyboardEvent) => void;
}

export type Void = () => void;

export type RelativeRect = {
    top: number
    left: number
    bottom: number
    right: number
    width: number
    height: number
}
export type Edge = {
    top: number
    left: number
    bottom: number
    right: number
}

export type Coordinates = {
    x: number
    y: number
}

export type Size = {
    width: number
    height: number
}

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





export type TypeModelDefault<T extends Record<string, unknown> = Record<string, unknown>> = {
    name?: string | ((ctx: NodeContext) => string);
    tagName?: string | ((ctx: NodeContext) => string);
    events?: string[] | ((ctx: NodeContext) => string[]);
    props?: {
        sx?: SxProps;
    }
};

export type NodeData<T extends Record<string, unknown> = Record<string, unknown>> = {
    isSelected: boolean;
    isHovered: boolean;
    isVisible: boolean;
    isDragover: boolean;
} & T;

export type TypeModel<T extends Record<string, unknown> = Record<string, unknown>> = {
    name: string;
    extends?: string;
    icon?: FC<{ size?: number, color?: string, node: NodeModel<T> }>;
    color?: string | {
        light: string;
        dark: string;
    }
    childrenColor?: string | {
        light: string;
        dark: string;
    };
    visibleOnTree?: boolean;

    data?: T;

    /**
     * Defines whether the node is an instance of this type.
     */
    isInstance?: (target: NodeObject) => boolean;

    /**
     * Defines whether the node can be dragged.
     * Used for drag-and-drop operations to determine if a node can be dragged.
     * this as the node passed to the type model as the dragging object.
     */
    draggable?: boolean | ((node: NodeModel<T>) => boolean);

    /**
     * Defines whether the node can accept children.
     * Used for drag-and-drop operations to determine if a node can accept children of a certain type.
     * this type model as the dragging object and the target node as the parent.
     */
    droppable?: string[] | boolean | ((target: NodeModel<T>) => boolean);

    /**
     * Defines whether the node can be accepted by this type.
     * Used for drag-and-drop operations to determine if a node can be dropped onto another node of this type.
     * this type model as the parent where the node is being dropped.
     */
    accepts?: string[] | ((source: NodeModel<T>) => string[]) | ((source: NodeModel<T>) => boolean);

    onCreate?: (node: NodeModel<T>) => void;
    onChildAdded?: (child: NodeModel<T>) => void;

    default?: TypeModelDefault<T>;
    actions?: TypeActionDefine | ((n: NodeModel<T>) => TypeActionDefine | undefined | void);
    commands?: {
        [k: string]: <
            P extends Record<string, any> = Record<string, any>
        >(props: {
            context: ModelContext,
            node: NodeModel<T>
        } & P) => void
    }
}
export type TypeActionDefine = {
    [key: string]: TypeAction | null | false
}

export type TypeAction = {
    title?: string;
    icon?: FC<{ size: number }>;
    active?: boolean;
    disabled?: boolean;
    visible?: boolean;
    order?: number;
}

export type TypeComponent<T extends Record<string, unknown> = Record<string, unknown>> = React.FC<T> & {
    model: TypeModel<T>;
}






export type BlockNodeObject = Omit<NodeObject, 'id' | 'parent'> & {
    children?: BlockNodeObject[];
}
export type Block = {
    label: string;
    category?: string;
    icon?: FC<{ size?: number, color?: string }>;
    content: BlockNodeObject;
}