import { nanoid } from "nanoid";
import { AssetObject, EditorAction, EditorState, NodeObject, Variable, PageObject } from "@/types";
import { REGISTRY } from "./node";

export const ROOT_NODE = {
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
} as NodeObject;

export const initialState: EditorState = {
    viewport: {
        scale: 1,
        width: 0,
        height: 0,
        scroll: { top: 0, left: 0 },
        rect: { top: 0, left: 0, bottom: 0, right: 0 }
    },
    nodes: new Map<string, NodeObject>(),
    variables: new Map<string, Map<string, Variable>>(),
    doms: new Map<string, HTMLElement>(),
    hovered: new Set<string>(),
    selected: new Set<string>(),
    dragged: new Set<string>(),
    devices: [
        { id: "desktop", name: "Desktop", width: "100%", height: "100%" },
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


const getValidNodeType = (target: string | NodeObject): string => {
    if (target && typeof target !== "string") {
        for (const type of Object.values(REGISTRY)) {
            if (type.model.isInstance && type.model.isInstance(target)) {
                return type.model.name;
            }
        }
        return "Element"; // Default to "Element" if no valid type is found
    }
    const validTypes = Object.keys(REGISTRY);
    if (validTypes.includes(String(target))) {
        return target as string;
    } else {
        return "Element";
    }
}

const fallbackNodeValidType = (node: NodeObject): NodeObject => {
    return {
        ...node,
        type: getValidNodeType(node)
    };
}

const updateParentChildren = (nodes: Map<string, NodeObject>, parentId: string | null) => {
    if (!parentId) return;
    const parent = nodes.get(parentId);
    if (!parent) return;

    const children = Array.from(nodes.values())
        .filter(node => node.parent === parentId);

    nodes.set(parentId, {
        ...parent,
        children
    })
}

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
                    rect: {
                        ...state.viewport.rect,
                        ...action.payload?.rect
                    }
                }
            }
        }

        // --- NODE MANAGEMENT ---
        case "ADD_NODE": {
            const newNodes = new Map(state.nodes);
            newNodes.set(action.payload.id, {
                ...action.payload,
                type: getValidNodeType(action.payload)
            });
            return { ...state, nodes: newNodes }
        }

        case "UPDATE_NODE": {
            const node = state.nodes.get(action.payload.id)
            if (!node) return state

            const newNodes = new Map(state.nodes)
            const newNode = {
                ...node,
                ...action.payload,
                id: node.id, // Ensure ID remains unchanged 
                type: getValidNodeType(action.payload), // Ensure type is valid
                props: {
                    ...node.props,
                    ...action.payload.props
                }
            };
            newNodes.set(action.payload.id, newNode);
            return { ...state, nodes: newNodes }
        }

        case "UPDATE_NODE_PROPS": {
            const node = state.nodes.get(action.payload.id);
            if (!node) return state;

            const newNodes = new Map(state.nodes);
            newNodes.set(action.payload.id, {
                ...node,
                props: {
                    ...node.props,
                    ...action.payload.props
                }
            });
            return { ...state, nodes: newNodes };
        }

        case "DELETE_NODE": {
            const targetNode = state.nodes.get(action.payload)
            if (!targetNode) return state

            const newNodes = new Map(state.nodes)
            const targetParent = targetNode.parent

            const getDescendants = (parentId: string): string[] => {
                let ids: string[] = []
                newNodes.forEach((node, id) => {
                    if (node.parent === parentId) {
                        ids.push(id)
                        ids.push(...getDescendants(id))
                    }
                })
                return ids
            }

            const descendantsToDelete = getDescendants(action.payload)
            const allDeletedIds = [action.payload, ...descendantsToDelete]

            allDeletedIds.forEach(id => newNodes.delete(id))
            if (targetParent) {
                updateParentChildren(newNodes, targetParent)
            }

            const newHovered = new Set(state.hovered)
            const newSelected = new Set(state.selected)
            const newDragged = new Set(state.dragged)

            allDeletedIds.forEach(id => {
                newHovered.delete(id)
                newSelected.delete(id)
                newDragged.delete(id)
            })

            return {
                ...state,
                nodes: newNodes,
                hovered: newHovered,
                selected: newSelected,
                dragged: newDragged
            }
        }

        case "SET_NODES": {
            const sourceNodes = new Map(action.payload);
            const newNodes = new Map();
            newNodes.set(ROOT_NODE.id, ROOT_NODE);

            // 3. Make all other parentless nodes children of the Root
            for (const [id, node] of sourceNodes.entries()) {
                if (id !== ROOT_NODE.id && !node.parent) {
                    newNodes.set(id, fallbackNodeValidType({
                        ...node,
                        parent: ROOT_NODE.id
                    }));
                } else {
                    newNodes.set(id, fallbackNodeValidType(node));
                }
            }

            return { ...state, nodes: newNodes };
        }

        case "ADD_VARIABLE": {
            const { nodeId, variable } = action.payload;
            const newVariables = new Map(state.variables);

            if (!newVariables.has(nodeId)) {
                newVariables.set(nodeId, new Map());
            }

            const nodeVariables = newVariables.get(nodeId)!;
            nodeVariables.set(variable.name, variable);

            return { ...state, variables: newVariables };
        }

        case "REMOVE_VARIABLE": {
            const { nodeId, variableName } = action.payload;
            const newVariables = new Map(state.variables);

            if (newVariables.has(nodeId)) {
                const nodeVariables = new Map(newVariables.get(nodeId));
                nodeVariables.delete(variableName);
                newVariables.set(nodeId, nodeVariables);
            }

            return { ...state, variables: newVariables };
        }

        case "UPDATE_VARIABLE": {
            const { nodeId, variable } = action.payload;
            const newVariables = new Map(state.variables);

            if (newVariables.has(nodeId)) {
                const nodeVariables = new Map(newVariables.get(nodeId));
                nodeVariables.set(variable.name, variable);
                newVariables.set(nodeId, nodeVariables);
            }

            return { ...state, variables: newVariables };
        }

        case "SET_DOM": {
            const newDoms = new Map(state.doms);
            newDoms.set(action.payload.id, action.payload.dom);
            return { ...state, doms: newDoms };
        }

        case "REMOVE_DOM": {
            const newDoms = new Map(state.doms);
            newDoms.delete(action.payload);
            return { ...state, doms: newDoms };
        }

        // --- INTERACTION STATES ---
        case "ADD_HOVERED":
            return { ...state, hovered: new Set(state.hovered).add(action.payload) }
        case "SET_HOVERED":
            return { ...state, hovered: new Set([action.payload]) }
        case "CLEAR_HOVERED":
            return { ...state, hovered: new Set() }
        case "REMOVE_HOVERED": {
            const newSet = new Set(state.hovered)
            newSet.delete(action.payload)
            return { ...state, hovered: newSet }
        }

        case "ADD_SELECTED":
            return { ...state, selected: new Set(state.selected).add(action.payload) }
        case "SET_SELECTED":
            return { ...state, selected: new Set([action.payload]) }
        case "CLEAR_SELECTED":
            return { ...state, selected: new Set() }
        case "REMOVE_SELECTED": {
            const newSet = new Set(state.selected)
            newSet.delete(action.payload)
            return { ...state, selected: newSet }
        }

        case "ADD_DRAGGED":
            return { ...state, dragged: new Set(state.dragged).add(action.payload) }
        case "REMOVE_DRAGGED": {
            const newSet = new Set(state.dragged)
            newSet.delete(action.payload)
            return { ...state, dragged: newSet }
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
            return state
    }
}