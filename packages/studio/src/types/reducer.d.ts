import type { NodeObject, NodeVariable, AssetObject, PageObject, Block } from "./index";

// 2. Fixed DeepPartial to prevent infinite recursion on complex objects
export type DeepPartial<T> = T extends Function | Map<any, any> | Set<any> | HTMLElement
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T;

export interface EditorState {
    devices: {
        id: string;
        name: string;
        width: number | string;
        height?: number | string;
    }[];
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
    };
    nodes: Map<string, NodeObject>;
    doms: Map<string, HTMLElement>;
    variables: Map<string, Map<string, NodeVariable>>;
    hovered: Set<string>;
    selected: Set<string>;
    dragged: Set<string>;
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

export type CoreActionMap = {
    UPDATE_VIEWPORT: Partial<EditorState["viewport"]>;
    ADD_NODE: NodeObject;
    INSERT_BLOCK: {
        block: Block;
        targetId: string;
        position: "before" | "after";
    };
    MOVE_NODE: {
        sourceId: string;
        targetId: string;
        position: "before" | "after";
    };
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
}

export type StrictActionUnion = {
    [K in keyof CoreActionMap]: CoreActionMap[K] extends never
    ? { type: K }
    : { type: K; payload: CoreActionMap[K] };
}[keyof CoreActionMap];

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