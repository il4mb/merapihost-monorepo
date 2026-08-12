import { nanoid } from "nanoid";
import { AssetObject, EditorAction, EditorState, NodeObject, Variable, PageObject, BlockNodeObject } from "@/types";
import { REGISTRY } from "./node";
import { merge } from "lodash";
import { nodeReducer } from "./node/nodeReducer";
import { NodeModel } from "./node/NodeModel";

export const ROOT_NODE = new NodeModel({
    id: "root",
    type: "Root",
    props: {
        style: {
            width: "100%",
            height: "100%",
            position: "relative",
            padding: 0,
            margin: 0,
            boxSizing: "border-box",
            display: "flow-root",
            overflow: "auto"
        }
    },
    parent: null
});

export const initialState: EditorState = {
    viewport: {
        scale: 1,
        width: 0,
        height: 0,
        scroll: { x: 0, y: 0 },
        edge: { top: 0, left: 0, bottom: 0, right: 0 },
        iframe: null
    },
    nodes: {
        collection: new Map<string, NodeModel>([[ROOT_NODE.id, ROOT_NODE]]),
        variables: new Map<string, Map<string, Variable>>(),
        hovered: new Set<string>(),
        selected: new Set<string>(),
    },

    devices: [
        { id: "desktop", name: "Desktop", width: 1600, height: 1080 },
        { id: "tablet", name: "Tablet", width: 768, height: 1024 },
        { id: "mobile", name: "Mobile", width: 420, height: 916 }
    ],
    device: "desktop",
    assets: {
        collection: new Map<string, AssetObject>(),
        selected: null,
        opened: null
    },
    pages: {
        collection: new Map<string, PageObject>(),
        selected: null,
        opened: null
    }
}


const buildBlockContent = (content: BlockNodeObject, parentId: string, nodesMap = new Map<string, NodeObject>()) => {
    const { children, ...rest } = content;

    // 1. Create the new node
    const newNode: NodeObject = fallbackNodeValidType({
        ...rest,
        id: nanoid(),
        parent: parentId,
    });

    const typeModel = REGISTRY[newNode.type]?.model;
    if (typeModel && typeModel.default.props && typeof newNode.props === "object" && newNode.props !== null) {
        // @ts-ignore
        newNode.props = merge({}, typeModel.default.props, newNode.props);
    }

    // 2. Add to flat Map store
    nodesMap.set(newNode.id, newNode);

    // 3. Process children recursively using the same Map accumulator
    if (Array.isArray(children) && children.length > 0) {
        children.forEach((childBlock) => {
            buildBlockContent(childBlock, newNode.id, nodesMap);
        });
    }

    return { rootNode: newNode, nodesMap };
};

const getValidNodeType = (target: string | NodeObject): string => {
    if (typeof target !== "string" && target !== null) {
        const targetType = target.type;
        // If the type is explicitly defined and exists in the registry, return it
        if (targetType in REGISTRY) {
            return targetType;
        }
        // Find matching registry type using model.isInstance
        const match = Object.values(REGISTRY).find(
            (item) => item.model.isInstance?.(target)
        );
        return match ? match.model.name : "Element";
    }

    // @ts-ignore
    return target in REGISTRY ? String(target) : "Element";
};

const fallbackNodeValidType = (node: NodeObject): NodeObject => ({
    ...node,
    type: getValidNodeType(node),
});



// ==========================================
// 3. STUDIO REDUCER
// ==========================================

export const studioReducer = (state: EditorState, action: EditorAction): EditorState => {
    switch (action.type) {
        case "UPDATE_VIEWPORT": {
            return {
                ...state,
                viewport: {
                    ...state.viewport,
                    ...action.payload,
                    scroll: {
                        ...state.viewport.scroll,
                        ...action.payload?.scroll
                    },
                    edge: {
                        ...state.viewport.edge,
                        ...action.payload?.edge
                    }
                }
            }
        }

        case "SET_DEVICE": {
            const deviceExists = state.devices.some(
                device => device.id === action.payload
            )
            if (!deviceExists) {
                console.warn(`Device with id "${action.payload}" does not exist.`)
                return state
            }
            return { ...state, device: action.payload }
        }

        // START OF ASSET MANAGEMENT
        case "SET_ASSETS": {
            // combined assets keep existing assets and add new ones, overwriting any with the same ID
            const combinedAssets = new Map(state.assets.collection);
            action.payload.forEach((asset, id) => {
                combinedAssets.set(id, asset);
            });
            return {
                ...state,
                assets: {
                    ...state.assets,
                    collection: combinedAssets
                }
            }
        }

        case "SET_SELECTED_ASSET": {
            return {
                ...state,
                assets: {
                    ...state.assets,
                    selected: action.payload
                }
            }
        }

        case "SET_OPENED_ASSET": {
            return {
                ...state,
                assets: {
                    ...state.assets,
                    opened: action.payload,
                    selected: null // Clear selected asset when opening a new one
                }
            }
        }
        // END OF ASSET MANAGEMENT

        // START OF PAGE MANAGEMENT
        case "SET_PAGES": {
            return {
                ...state,
                pages: {
                    ...state.pages,
                    collection: new Map(action.payload)
                }
            }
        }

        case "ADD_PAGE": {
            const newPages = new Map(state.pages.collection);
            newPages.set(action.payload.id, action.payload);

            return {
                ...state,
                pages: {
                    ...state.pages,
                    collection: newPages
                }
            }
        }

        case "UPDATE_PAGE": {
            const page = state.pages.collection.get(action.payload.id);
            if (!page) {
                console.warn(`Page with id "${action.payload.id}" does not exist.`);
                return state;
            }
            const updatedPage = {
                ...page,
                ...action.payload.data
            } as PageObject;
            const newPages = new Map(state.pages.collection);
            newPages.set(action.payload.id, updatedPage);

            return {
                ...state,
                pages: {
                    ...state.pages,
                    collection: newPages
                }
            }
        }

        case "REMOVE_PAGE": {
            const newPages = new Map(state.pages.collection);
            newPages.delete(action.payload);

            // If the removed page was selected or opened, clear those states
            const isSelectedPageRemoved = state.pages.selected?.id === action.payload;
            const isOpenedPageRemoved = state.pages.opened?.id === action.payload;

            return {
                ...state,
                pages: {
                    ...state.pages,
                    collection: newPages,
                    selected: isSelectedPageRemoved ? null : state.pages.selected,
                    opened: isOpenedPageRemoved ? null : state.pages.opened
                }
            }
        }

        case "SET_SELECTED_PAGE": {
            return {
                ...state,
                pages: {
                    ...state.pages,
                    selected: action.payload
                }
            }
        }

        case "SET_OPENED_PAGE": {
            return {
                ...state,
                pages: {
                    ...state.pages,
                    opened: action.payload,
                    selected: null // Clear selected page when opening a new one
                }
            }
        }
        // END OF PAGE MANAGEMENT

        case "BULK": {
            return action.payload.reduce((currentState, bulkAction) => {
                // @ts-ignore - TS might still complain about accessing type on a generic union, 
                // but we know it exists on all actions.
                if (bulkAction.type === "BULK") {
                    console.warn("Nested BULK actions are not allowed. Ignoring this action.");
                    return currentState;
                }

                // Just pass the entire action object directly. 
                // It is already a valid EditorAction!
                return studioReducer(currentState, bulkAction as EditorAction);

            }, state);
        }

        default:
            return {
                ...state,
                nodes: nodeReducer(state.nodes, action)
            }
    }
}