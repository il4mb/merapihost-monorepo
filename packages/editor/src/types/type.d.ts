import React from "react";
import { NodeObject } from "@editor/type"; // Adjust import as needed
import { FC, RefObject } from "react";
import { NodeObject, NodeVariable } from "./node";
import { AssetObject } from "./asset";  


export type RelativeRect = {
    top: number
    left: number
    bottom: number
    right: number
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
        events?: string[] | ((this: TypeContext<T>) => string[]);
        props?: T;
    };
}
export type TypeComponent<T = any> = React.FC<T> & {
    model: TypeModel<T>;
}

export type Block = {
    label: string;
    type: string;
    icon?: React.ReactNode;
    defaultProps?: Record<string, any>;
}