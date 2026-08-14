import { NodeModel } from "@/libs/node/NodeModel";
import type { NodeObject, NodeVariable, AssetObject, PageObject, Block, Edge, Coordinates } from "./index";

// 2. Fixed DeepPartial to prevent infinite recursion on complex objects
export type DeepPartial<T> = T extends Function | Map<any, any> | Set<any> | HTMLElement
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;


export type Viewport = {
    scale: number;
    width: number;
    height: number;
    scroll: Coordinates;
    edge: Edge;
    iframe: HTMLIFrameElement | null;
}


export interface NodeState {
    status: "idle" | "editing" | "preview";
    collection: Map<string, NodeModel>;
    variables: Map<string, Map<string, NodeVariable>>;
    hovered: Set<string>;
    selected: Set<string>;
}



export interface EditorState {
    devices: {
        id: string;
        name: string;
        width: number | string;
        height?: number | string;
    }[];
    viewport: Viewport;
    nodes: NodeState;
    device: string;

    assets: {
        collection: Map<string, AssetObject>;
        selected: AssetObject | null;
        opened: AssetObject | null;
    };

    pages: {
        collection: Map<string, PageObject>;
        selected: PageObject | null;
        opened: PageObject | null;
    };
}

export type NodeActions = {
    SET_NODE_STATE_STATUS: NodeState["status"];
    ADD_NODE: NodeObject;
    INSERT_BLOCK: {
        block: Block;
        targetId: string;
        position: "before" | "after" | "inside";
    };
    MOVE_NODE: {
        sourceId: string;
        targetId: string;
        position: "before" | "after" | "inside";
    };
    UPDATE_NODE: {
        id: string
    } & DeepPartial<Omit<NodeObject, "id">>;

    UPDATE_NODE_PROPS: {
        id: string
        props: Record<string, any>
    };

    SET_NODE_CHILDREN: {
        id: string;
        children: (NodeObject | NodeModel)[] | Map<string, NodeModel>;
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
}

export type CoreActionMap = {
    UPDATE_VIEWPORT: Partial<EditorState["viewport"]>;
    SET_DEVICE: string;
    SET_ASSETS: Map<string, AssetObject>;
    SET_SELECTED_ASSET: AssetObject | null;
    SET_OPENED_ASSET: AssetObject | null;
    SET_PAGES: Map<string, PageObject>;
    ADD_PAGE: PageObject;
    UPDATE_PAGE: {
        id: string;
        data: DeepPartial<Omit<PageObject, "id">>;
    };
    REMOVE_PAGE: string;
    SET_SELECTED_PAGE: PageObject | null;
    SET_OPENED_PAGE: PageObject;
};


// 1. Convert any action payload map into a Discriminated Union of Actions
export type ActionUnion<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends never
    ? { type: K }
    : undefined extends T[K]
    ? { type: K; payload?: T[K] }
    : { type: K; payload: T[K] };
}[keyof T];

// 2. Generic Action that includes all actions from map T + the BULK action
export type GenericAction<T extends Record<string, any>> =
    | ActionUnion<T>
    | { type: "BULK"; payload: GenericAction<T>[] };

// 3. Concrete action unions for your editor
export type CoreEditorAction = GenericAction<CoreActionMap>;
export type NodeEditorAction = GenericAction<NodeActions>;

// Combined action union if your editor handles both node and core actions
export type EditorAction = GenericAction<CoreActionMap & NodeActions>;

// 4. Generic Reducer definition
export type GenericReducer<S, A extends Record<string, any>> = (
    state: S,
    action: GenericAction<A>
) => S;