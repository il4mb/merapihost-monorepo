import { nanoid } from "nanoid";
import { EditorAction, EditorState } from "../type"
import { NodeObject, Variable } from "../types/node";

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
    device: "mobile"
}

const updateParentChildren = (nodes: Map<string, NodeObject>, parentId: string | null) => {
    if (!parentId) return;
    const parent = nodes.get(parentId);
    if (!parent) return;

    const children = Array.from(nodes.values())
        .filter(node => node.parent === parentId);

    nodes.set(parentId, {
        ...parent,

    })
}

// ==========================================
// 3. EDITOR REDUCER
// ==========================================

export const editorReducer = (
    state: EditorState,
    action: EditorAction
): EditorState => {
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
            const newNodes = new Map(state.nodes)
            const targetParent = action.payload.data.parent

            // Insert initial node profile
            newNodes.set(action.payload.id, {
                ...action.payload,
                data: {
                    ...action.payload.data,
                    nodes: []
                }
            })

            updateParentChildren(newNodes, targetParent)
            return { ...state, nodes: newNodes }
        }

        case "UPDATE_NODE": {
            const node = state.nodes.get(action.payload.id)
            if (!node) return state

            const newNodes = new Map(state.nodes)
            const oldParent = node.parent

            const newParent =
                action.payload?.parent !== undefined
                    ? action.payload.parent
                    : oldParent

            newNodes.set(action.payload.id, {
                ...node,
                ...action.payload,
                id: node.id, // Ensure ID remains unchanged 
                props: {
                    ...node.props,
                    ...action.payload.props
                }
            });

            if (oldParent !== newParent) {
                updateParentChildren(newNodes, oldParent)
            }
            updateParentChildren(newNodes, newParent)

            return { ...state, nodes: newNodes }
        }

        case "UPDATE_NODE_PROPS": {
            const node = state.nodes.get(action.payload.id)
            if (!node) return state;

            const newNodes = new Map(state.nodes)
            newNodes.set(action.payload.id, {
                ...node,
                data: {
                    ...node.data,
                    props: {
                        ...node.data.props,
                        ...action.payload.props
                    }
                }
            })
            return { ...state, nodes: newNodes }
        }

        case "DELETE_NODE": {
            const targetNode = state.nodes.get(action.payload)
            if (!targetNode) return state

            const newNodes = new Map(state.nodes)
            const targetParent = targetNode.data.parent

            const getDescendants = (parentId: string): string[] => {
                let ids: string[] = []
                newNodes.forEach((node, id) => {
                    if (node.data.parent === parentId) {
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
            // We use a fresh map so we don't carry over mismatched keys from action.payload
            const sourceNodes = new Map(action.payload);
            const newNodes = new Map();
            let rootNode = null;

            // 1. Single Pass: Sanitize IDs, assign types, and locate Root
            for (const [oldKey, node] of sourceNodes.entries()) {
                const sanitizedNode = { ...node };

                // Fix missing IDs
                if (!sanitizedNode.id) {
                    sanitizedNode.id = nanoid();
                }

                // Fix missing types
                if (!sanitizedNode.type) {
                    sanitizedNode.type = "Element";
                }

                // Identify Root
                if (sanitizedNode.type === "Root") {
                    rootNode = sanitizedNode;
                }

                // Store securely using the guaranteed ID as the Map key
                newNodes.set(sanitizedNode.id, sanitizedNode);
            }

            // 2. If Root doesn't exist, create and append it
            if (!rootNode) {
                rootNode = {
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
                    parent: null,
                    order: 0
                };
                newNodes.set(rootNode.id, rootNode);
            }

            // 3. Make all other parentless nodes children of the Root
            for (const [id, node] of newNodes.entries()) {
                if (id !== rootNode.id && !node.parent) {
                    newNodes.set(id, {
                        ...node,
                        parent: rootNode.id
                    });
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
                return editorReducer(currentState, bulkAction as EditorAction);

            }, state);
        }

        default:
            return state
    }
}