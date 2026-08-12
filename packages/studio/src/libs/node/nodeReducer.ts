import { nanoid } from "nanoid";
import { NodeState, NodeObject, Variable, BlockNodeObject, NodeActions, GenericAction } from "@/types";
import { NodeModel } from "./NodeModel";

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

export const initialState: NodeState = {
    collection: new Map<string, NodeModel>(),
    variables: new Map<string, Map<string, Variable>>(),
    hovered: new Set<string>(),
    selected: new Set<string>()
}

const buildBlockContent = (content: BlockNodeObject, parentId: string, nodesMap = new Map<string, NodeModel>()) => {
    const { children, ...rest } = content;

    // 1. Create the new node
    const newNode = new NodeModel({
        ...rest,
        id: nanoid(),
        parent: parentId,
    });
    nodesMap.set(newNode.id, newNode);
    // 3. Process children recursively using the same Map accumulator
    if (Array.isArray(children) && children.length > 0) {
        children.forEach((childBlock) => {
            buildBlockContent(childBlock, newNode.id, nodesMap);
        });
    }

    return { rootNode: newNode, nodesMap };
};

export const nodeReducer = (state: NodeState, action: GenericAction<NodeActions>): NodeState => {
    switch (action.type) {
        case "SET_NODES": {

            const newNodes = new Map<string, NodeModel>();
            newNodes.set(ROOT_NODE.id, new NodeModel(ROOT_NODE));

            for (const [id, node] of action.payload.entries()) {
                if (id !== ROOT_NODE.id && !node.parent) {
                    newNodes.set(id, new NodeModel({ ...node, parent: ROOT_NODE.id }));
                } else {
                    newNodes.set(id, new NodeModel(node));
                }
            }

            return { ...state, collection: newNodes };
        }

        // --- NODE MANAGEMENT ---
        case "ADD_NODE": {
            const newNodes = new Map(state.collection);
            newNodes.set(action.payload.id, new NodeModel(action.payload));
            return { ...state, collection: newNodes }
        }

        case "INSERT_BLOCK": {
            const { block, targetId, position } = action.payload;

            // 1. Get target reference
            const targetNode = state.collection.get(targetId);
            if (!targetNode) {
                console.warn(`Target node not found for INSERT_BLOCK action.`);
                return state;
            }

            const newNodes = new Map(state.collection);
            const targetParentId = targetNode.parent;

            // 2. Build root node and all recursive children under target's parent
            const { rootNode, nodesMap: blockNodes } = buildBlockContent(block.content, targetParentId);

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
                const updatedNode = new NodeModel(node);
                updatedNode.order = index;
                newNodes.set(node.id, updatedNode);
            });

            return {
                ...state,
                collection: newNodes,
                selected: new Set([rootNode.id]),
                hovered: new Set()
            };
        }

        case "MOVE_NODE": {
            const { sourceId, targetId, position } = action.payload;

            // 1. Get references
            const sourceNode = state.collection.get(sourceId) ? new NodeModel(state.collection.get(sourceId)!) : null;
            const targetNode = state.collection.get(targetId) ? new NodeModel(state.collection.get(targetId)!) : null;

            if (!sourceNode || !targetNode) {
                console.warn(`Source or target node not found for MOVE_NODE action.`);
                return state;
            }

            const newNodes = new Map(state.collection);
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
            sourceNode.parent = targetParentId;

            // 6. Insert the source node into the siblings array at the calculated index
            targetSiblings.splice(insertIndex, 0, sourceNode);

            // 7. Iterate through the modified array and reassign sequential `order` numbers (0, 1, 2, 3...)
            targetSiblings.forEach((node, index) => {
                const updatedNode = new NodeModel(node);
                updatedNode.order = index;
                newNodes.set(node.id, updatedNode);
            });

            // 8. (Optional but recommended) If the node was moved to a DIFFERENT parent, 
            // re-index the old parent's children to remove the gap left behind.
            if (oldParentId !== targetParentId) {
                const oldSiblings = Array.from(newNodes.values())
                    .filter(node => node.parent === oldParentId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                oldSiblings.forEach((node, index) => {
                    const updatedNode = new NodeModel(node);
                    updatedNode.order = index;
                    newNodes.set(node.id, updatedNode);
                });
            }

            // 9. Return updated state
            return {
                ...state,
                collection: newNodes
            };
        }

        case "UPDATE_NODE": {
            const node = state.collection.get(action.payload.id) ? new NodeModel(state.collection.get(action.payload.id)!) : null;
            if (!node) return state

            const newNodes = new Map(state.collection);

            if ("name" in action.payload && action.payload.name !== undefined) {
                node.name = action.payload.name;
            }
            if ("props" in action.payload && action.payload.props !== undefined) {
                node.props = {
                    ...node.props,
                    ...action.payload.props
                };
            }
            if ("content" in action.payload && action.payload.content !== undefined) {
                node.content = action.payload.content;
            }
            if ("tagName" in action.payload && action.payload.tagName !== undefined) {
                node.tagName = action.payload.tagName;
            }
            if ("parent" in action.payload && action.payload.parent !== undefined) {
                node.parent = action.payload.parent;
            }
            if ("order" in action.payload && action.payload.order !== undefined) {
                node.order = action.payload.order;
            }
            if ("visible" in action.payload && action.payload.visible !== undefined) {
                node.visible = action.payload.visible;
            }

            newNodes.set(action.payload.id, node);

            return { ...state, collection: newNodes }
        }

        case "UPDATE_NODE_PROPS": {
            const updateNode = state.collection.get(action.payload.id) ? new NodeModel(state.collection.get(action.payload.id)!) : null;
            if (!updateNode) return state;

            const newNodes = new Map(state.collection);
            updateNode.props = {
                ...updateNode.props,
                ...action.payload.props
            };
            newNodes.set(action.payload.id, updateNode);
            return { ...state, collection: newNodes };
        }

        case "DELETE_NODE": {
            const targetNode = state.collection.get(action.payload)
            if (!targetNode) return state

            const newNodes = new Map(state.collection);

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

            allDeletedIds.forEach(id => {
                newHovered.delete(id)
                newSelected.delete(id)
            })

            return {
                ...state,
                collection: newNodes,
                hovered: newHovered,
                selected: newSelected
            }
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
            const node = state.collection.get(action.payload.id) ? new NodeModel(state.collection.get(action.payload.id)!) : null;
            if (!node) return state;

            const newNodes = new Map(state.collection);
            node.dom = action.payload.dom;
            newNodes.set(action.payload.id, node);

            return {
                ...state,
                collection: newNodes
            }
        }

        case "REMOVE_DOM": {
            const node = state.collection.get(action.payload) ? new NodeModel(state.collection.get(action.payload)!) : null;
            if (!node) return state;

            const newNodes = new Map(state.collection);
            node.dom = null;
            newNodes.set(action.payload, node);

            return {
                ...state,
                collection: newNodes
            }
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
                return nodeReducer(currentState, bulkAction);

            }, state);
        }

        default:
            return state
    }
}