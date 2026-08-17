import type { NodeModel } from "@/libs/node/NodeModel";
import type { NodeObject, NodeVariable, AssetObject, PageObject, Block, Edge, Coordinates, NodeData, NodeUpdateInput } from "./index";

export type DeepPartial<T> = T extends Function | Map<any, any> | Set<any> | HTMLElement
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

export type ActionUnion<T extends Record<string, any>> = {
    [K in keyof T]: [T[K]] extends [never] | [void] | [undefined]
    ? { type: K }
    : { type: K; payload: T[K] };
}[keyof T];

export type GenericAction<T extends Record<string, any>> =
    | ActionUnion<T>
    | { type: "BULK"; payload: GenericAction<T>[] };


export type Viewport = {
    scale: number;
    width: number;
    height: number;
    scroll: Coordinates;
    edge: Edge;
    iframe: HTMLIFrameElement | null;
}


export type NodeHistory = {
    past: Map<string, NodeModel>[];
    future: Map<string, NodeModel>[];
}

export type NodeState = {
    status: "idle" | "editing" | "preview";
    collection: Map<string, NodeModel>;
    histories: NodeHistory;
    variables: Map<string, Map<string, NodeVariable>>;
    hovered: Set<string>;
    selected: Set<string>;
}


export type StudioState = {
    devices: {
        id: string;
        name: string;
        width: number | string;
        height?: number | string;
    }[];
    viewport: Viewport;
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

export type RootState = {
    studio: StudioState;
    nodes: NodeState;
}
type RootAction = StudioReducerAction | NodeReducerAction;


export type NodeActionMap = {
    REDO: void;
    UNDO: void;
    CLEAR_HISTORY: void;
    SET_STATUS: NodeState["status"];
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
    UPDATE_NODE: { id: string } & NodeUpdateInput;

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

export type StudioActionMap = {
    UPDATE_VIEWPORT: Partial<StudioState["viewport"]>;
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


// Concrete action unions for your editor
export type StudioReducerAction = GenericAction<StudioActionMap>;
export type NodeReducerAction = GenericAction<NodeActionMap>;


// Combined action union if your editor handles both node and core actions
export type EditorAction = GenericAction<StudioActionMap & NodeActionMap>;

// Generic Reducer definition
export type GenericReducer<S, A extends Record<string, any>> = (state: S, action: GenericAction<A>) => S;