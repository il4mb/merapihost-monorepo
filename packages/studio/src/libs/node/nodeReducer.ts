import { nanoid } from "nanoid";
import { NodeState, NodeObject, Variable, BlockNodeObject, NodeActions, GenericAction } from "@/types";
import { NodeModel } from "./NodeModel";

export const ROOT_NODE = {
    id: "root",
    type: "root",
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

export const initialNodesState: NodeState = {
    status: "editing",
    collection: new Map<string, NodeModel>(),
    variables: new Map<string, Map<string, Variable>>(),
    hovered: new Set<string>(),
    selected: new Set<string>()
}

const getDescendants = (collection: Map<string, NodeModel>, parentId: string): string[] => {
    let ids: string[] = [];
    collection.forEach((node, id) => {
        if (node.parent === parentId) {
            ids.push(id);
            ids.push(...getDescendants(collection, id));
        }
    });
    return ids;
}

export const nodeReducer = (state: NodeState, action: GenericAction<NodeActions>): NodeState => {
    switch (action.type) {
        case "SET_NODE_STATE_STATUS": {
            return { ...state, status: action.payload };
        }

        case "SET_NODES": {
            let newNodes = new Map<string, NodeModel>();
            newNodes.set(ROOT_NODE.id, new NodeModel(ROOT_NODE));

            for (const [id, node] of action.payload.entries()) {
                if (id !== ROOT_NODE.id && !node.parent) {
                    const newNode = new NodeModel({ ...node, parent: ROOT_NODE.id });
                    newNodes.set(id, newNode);
                } else {
                    const newNode = new NodeModel(node);
                    newNodes.set(id, newNode);
                }
            }

            for (const node of newNodes.values()) {
                if (node.parent && newNodes.has(node.parent)) {
                    const parentNode = newNodes.get(node.parent);
                    parentNode?.type.model.onChildAdded?.(node);
                }
            }
            return { ...state, collection: newNodes };
        }

        // --- NODE MANAGEMENT ---
        case "ADD_NODE": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;
            const newNodes = new Map(state.collection);
            const newNode = new NodeModel(action.payload);
            newNodes.set(newNode.id, newNode);

            // newNode.type.model.onCreate?.(newNode, newNodes);
            return { ...state, collection: newNodes }
        }

        case "INSERT_BLOCK": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

            const { block, targetId, position } = action.payload;

            // 1. Get target reference
            const targetNode = state.collection.get(targetId);
            if (!targetNode) {
                console.warn(`Target node not found for INSERT_BLOCK action.`);
                return state;
            }

            const newNodes = new Map(state.collection);

            // 2. Determine the actual parent (if 'inside', the target itself becomes the parent)
            const targetParentId = position === "inside" ? targetNode.id : targetNode.parent;

            // 3. Build root node and all recursive children under the determined parent
            const { root: rootNode, collection: blockNodes } = NodeModel.build(block.content, targetParentId, new Map<string, NodeModel>());

            // 4. Merge all generated nodes into the state Map
            blockNodes.forEach((node, id) => {
                newNodes.set(id, node);
            });

            // 5. Get existing siblings under the new parent (excluding the new root)
            const targetSiblings = Array.from(newNodes.values())
                .filter((node) => node.parent === targetParentId && node.id !== rootNode.id)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 6. Insert the node based on the position
            if (position === "inside") {
                // If dropping inside, append it to the end of the container's children
                targetSiblings.push(rootNode);
            } else {
                // Find target's index among siblings
                const targetIndex = targetSiblings.findIndex((node) => node.id === targetId);

                if (targetIndex !== -1) {
                    // Calculate insertion index strictly for before | after
                    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
                    targetSiblings.splice(insertIndex, 0, rootNode);
                } else {
                    targetSiblings.push(rootNode); // Failsafe fallback
                }
            }

            // 7. Reassign sequential order numbers (0, 1, 2, 3...)
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
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

            const { sourceId, targetId, position } = action.payload;

            // 1. Get references
            const sourceNode = state.collection.get(sourceId) ? new NodeModel(state.collection.get(sourceId)!) : null;
            const targetNode = state.collection.get(targetId) ? new NodeModel(state.collection.get(targetId)!) : null;

            if (!sourceNode || !targetNode) {
                console.warn(`Source or target node not found for MOVE_NODE action.`);
                return state;
            }

            const newNodes = new Map(state.collection);

            // 2. Determine the actual parent (if 'inside', the target itself becomes the parent)
            const targetParentId = position === "inside" ? targetNode.id : targetNode.parent; // Add fallback if needed: || ROOT_NODE.id
            const oldParentId = sourceNode.parent;

            // 3. Get the target's siblings (or children, if 'inside'), EXCLUDING the dragged node
            const targetSiblings = Array.from(newNodes.values())
                .filter(node => node.parent === targetParentId && node.id !== sourceId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 4. Update the source node's parent reference
            sourceNode.parent = targetParentId;

            // 5. Insert the node based on the position
            if (position === "inside") {
                // If dropping inside, append it to the end of the container's children
                targetSiblings.push(sourceNode);
            } else {
                // Find the target's index in this clean list
                const targetIndex = targetSiblings.findIndex(node => node.id === targetId);

                if (targetIndex !== -1) {
                    // Calculate exact insertion point
                    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
                    targetSiblings.splice(insertIndex, 0, sourceNode);
                } else {
                    targetSiblings.push(sourceNode); // Failsafe fallback
                }
            }

            // 6. Iterate through the modified array and reassign sequential `order` numbers (0, 1, 2, 3...)
            targetSiblings.forEach((node, index) => {
                const updatedNode = new NodeModel(node);
                updatedNode.order = index;
                newNodes.set(node.id, updatedNode);
            });

            // 7. If the node was moved to a DIFFERENT parent, re-index the old parent's children to close the gap
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

            // 8. Return updated state
            return {
                ...state,
                collection: newNodes
            };
        }

        case "UPDATE_NODE": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

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
            if ("selectable" in action.payload && action.payload.selectable !== undefined) {
                node.selectable = Boolean(action.payload.selectable);
            }
            if ("hoverable" in action.payload && action.payload.hoverable !== undefined) {
                node.hoverable = Boolean(action.payload.hoverable);
            }

            newNodes.set(action.payload.id, node);

            return { ...state, collection: newNodes }
        }

        case "UPDATE_NODE_PROPS": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

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
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

            const targetNode = state.collection.get(action.payload)
            if (!targetNode) return state;
            if (String(targetNode.type.model.name).toLowerCase() === "root") {
                console.warn("Cannot remove DOM reference for the Root node.");
                return state;
            }

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
            };

            const descendantsToDelete = getDescendants(action.payload);
            const allDeletedIds = [action.payload, ...descendantsToDelete];
            allDeletedIds.forEach(id => {
                newNodes.delete(id)
            });


            const newHovered = new Set(state.hovered);
            const newSelected = new Set(state.selected);

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

        case "SET_NODE_CHILDREN": {
            if (state.status !== "editing") return state;

            const targetId = action.payload.id;
            if (!state.collection.has(targetId)) return state;

            const newNodes = new Map(state.collection);

            // 1. Remove old descendants of target container
            const descendantsToDelete = getDescendants(state.collection, targetId);
            descendantsToDelete.forEach(id => {
                newNodes.delete(id);
            });

            // 2. Add new children (handles both Map and Array payloads)
            const childrenPayload = action.payload.children;
            const childrenList = childrenPayload instanceof Map
                ? Array.from(childrenPayload.values())
                : childrenPayload;

            childrenList.forEach(child => {
                const childNode = new NodeModel(child);
                if (childNode.parent == null) {
                    childNode.parent = targetId;
                }
                newNodes.set(childNode.id, childNode);
            });

            // 3. PURGE ORPHANS: Delete any node whose parent no longer exists
            let orphanFound = true;
            while (orphanFound) {
                orphanFound = false;
                for (const [id, node] of newNodes.entries()) {
                    if (node.id !== targetId && node.parent != null && !newNodes.has(node.parent)) {
                        newNodes.delete(id);
                        orphanFound = true;
                    }
                }
            }

            // debug 
            const descendantsAfter = getDescendants(newNodes, targetId);
            const arrayItems = Array.from(newNodes.values())
                .filter(n => descendantsAfter.includes(n.id) || n.id === targetId)
                .map(n => n.toJSON());
            console.debug("SET_NODE_CHILDREN: Updated node collection:", JSON.stringify(arrayItems, null, 2));

            return { ...state, collection: newNodes };
        }

        case "ADD_VARIABLE": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

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
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

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
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

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
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

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