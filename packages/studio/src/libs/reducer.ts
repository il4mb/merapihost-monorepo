import { nanoid } from "nanoid";
import { AssetObject, EditorAction, EditorState, NodeObject, Variable, PageObject, BlockNodeObject } from "@/types";
import { REGISTRY } from "./node";
import { merge } from "lodash";

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
        { id: "desktop", name: "Desktop", width: 1920, height: 1080 },
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

        case "INSERT_BLOCK": {
            const { block, targetId, position } = action.payload;

            // 1. Get target reference
            const targetNode = state.nodes.get(targetId);
            if (!targetNode) {
                console.warn(`Target node not found for INSERT_BLOCK action.`);
                return state;
            }

            const newNodes = new Map(state.nodes);
            const targetParentId = targetNode.parent;

            // 2. Build root node and all recursive children under target's parent
            const { rootNode, nodesMap: blockNodes } = buildBlockContent(block.content, targetParentId);

            console.log(Array.from(blockNodes.values()));
            // 3. Merge all generated nodes into the state Map
            blockNodes.forEach((node, id) => {
                newNodes.set(id, node);
            });

            // 4. Get existing siblings under the parent (excluding the new root)
            const targetSiblings = Array.from(newNodes.values())
                .filter((node) => node.parent === targetParentId && node.id !== rootNode.id)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 5. Find target's index
            const targetIndex = targetSiblings.findIndex((node) => node.id === targetId);
            if (targetIndex === -1) return state; // Failsafe

            // 6. Calculate insertion index strictly for before | after
            const insertIndex = position === "before" ? targetIndex : targetIndex + 1;

            // 7. Insert the root node into siblings list
            targetSiblings.splice(insertIndex, 0, rootNode);

            // 8. Reassign sequential order numbers (0, 1, 2, 3...)
            targetSiblings.forEach((node, index) => {
                newNodes.set(node.id, {
                    ...node,
                    order: index,
                });
            });

            return {
                ...state,
                nodes: newNodes,
            };
        }

        case "MOVE_NODE": {
            const { sourceId, targetId, position } = action.payload;

            // 1. Get references
            const sourceNode = state.nodes.get(sourceId);
            const targetNode = state.nodes.get(targetId);

            if (!sourceNode || !targetNode) {
                console.warn(`Source or target node not found for MOVE_NODE action.`);
                return state;
            }

            const newNodes = new Map(state.nodes);
            const targetParentId = targetNode.parent; // Add fallback if needed: || ROOT_NODE.id
            const oldParentId = sourceNode.parent;

            // 2. Get the target's siblings, EXCLUDING the dragged node, and sort them by current order
            const targetSiblings = Array.from(newNodes.values())
                .filter(node => node.parent === targetParentId && node.id !== sourceId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 3. Find the target's index in this clean list
            const targetIndex = targetSiblings.findIndex(node => node.id === targetId);
            if (targetIndex === -1) return state; // Failsafe

            // 4. Calculate exact insertion point
            const insertIndex = position === "before" ? targetIndex : targetIndex + 1;

            // 5. Update the source node's parent (order is handled below)
            const updatedSourceNode = {
                ...sourceNode,
                parent: targetParentId
            };

            // 6. Insert the source node into the siblings array at the calculated index
            targetSiblings.splice(insertIndex, 0, updatedSourceNode);

            // 7. Iterate through the modified array and reassign sequential `order` numbers (0, 1, 2, 3...)
            targetSiblings.forEach((node, index) => {
                newNodes.set(node.id, {
                    ...node,
                    order: index
                });
            });

            // 8. (Optional but recommended) If the node was moved to a DIFFERENT parent, 
            // re-index the old parent's children to remove the gap left behind.
            if (oldParentId !== targetParentId) {
                const oldSiblings = Array.from(newNodes.values())
                    .filter(node => node.parent === oldParentId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                oldSiblings.forEach((node, index) => {
                    newNodes.set(node.id, {
                        ...node,
                        order: index
                    });
                });
            }

            // 9. Return updated state
            return {
                ...state,
                nodes: newNodes
            };
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