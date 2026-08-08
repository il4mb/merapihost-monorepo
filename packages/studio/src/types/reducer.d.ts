import type { NodeObject, NodeVariable } from "./node";
import type { AssetObject } from "./asset";

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T

export interface EditorState {
    /**
     * devices is an array of device configurations that the editor can simulate. Each device has an id, name, width, and optional height. This allows users to preview their designs on different screen sizes and orientations, facilitating responsive design testing and development.
     */
    devices: {
        id: string;
        name: string;
        width: number | string;
        height?: number | string;
    }[];
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
    };
    // resolver: Record<string, Component<any>> // Changed from Set to Record for O(1) lookups by name
    nodes: Map<string, NodeObject>;
    /**
     * doms is a Map where the key is the nodeId and the value is the corresponding HTMLElement.
     */
    doms: Map<string, HTMLElement>;
    /**
     * variables is a Map where the key is the nodeId and the value is another Map of variableName to NodeVariable.
     * This allows us to store multiple variables for each node, and easily retrieve or update them by nodeId and variableName.
     */
    variables: Map<string, Map<string, NodeVariable>>;
    /**
     * hovered is a Set of nodeIds that are currently being hovered over in the editor. This can be used to apply specific styles or behaviors to nodes while they are hovered.
     */
    hovered: Set<string>;
    /**
     * selected is a Set of nodeIds that are currently selected in the editor. This allows for multiple selection and easy checking of whether a node is selected.
     */
    selected: Set<string>;
    /**
     * dragged is a Set of nodeIds that are currently being dragged in the editor. This can be used to apply specific styles or behaviors to nodes while they are being dragged.
     */
    dragged: Set<string>;
    /**
     * device represents the currently active device or viewport configuration in the editor. This can be used to apply responsive design settings or to preview the layout on different screen sizes.
     */
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

    SET_ASSETS: Map<string, AssetObject>;
    SET_SELECTED_ASSET: AssetObject | null;
    SET_OPENED_ASSET: AssetObject | null;

    SET_PAGES: Map<string, PageObject>;
    SET_SELECTED_PAGE: PageObject | null;
    SET_OPENED_PAGE: PageObject;

    SET_OPTIONS: DeepPartial<EditorState["options"]>;
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
