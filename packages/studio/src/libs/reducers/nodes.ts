import { NodeState, NodeObject, Variable, NodeHistory, NodeReducerAction } from "@/types";
import { NodeModel } from "@/libs/node/NodeModel";
import { getNodeDescendants, purgeOrphanNodes } from "../node";

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

export const INITIAL_NODES_STATE: NodeState = {
    status: "editing",
    collection: new Map<string, NodeModel>(),
    variables: new Map<string, Map<string, Variable>>(),
    hovered: new Set<string>(),
    selected: new Set<string>(),
    histories: {
        past: [],
        future: []
    }
}

const MAX_HISTORY_VERSION = 100;

/**
 * Resets the undo/redo stacks (e.g., when loading a new document).
 */
const applyResetHistory = (state: NodeState): NodeState => {
    return {
        ...state,
        histories: {
            past: [],
            future: []
        }
    };
};

/**
 * Pushes the current collection into the `past` history stack.
 * Call this BEFORE mutating `state.collection` on undoable actions.
 */
const pushHistory = (state: NodeState): NodeHistory => {
    const past = [...state.histories.past, state.collection];

    // Maintain maximum history depth limit
    if (past.length > MAX_HISTORY_VERSION) {
        past.shift();
    }

    console.log("PAST", past.length);

    return {
        past,
        future: [] // Any new edit clears the redo stack
    };
};

/**
 * Performs UNDO: moves current state to future, restores last past state.
 */
const applyUndo = (state: NodeState): NodeState => {
    const { past, future } = state.histories;
    if (past.length === 0) return state; // Nothing to undo

    const previousCollection = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const newFuture = [state.collection, ...future];

    return {
        ...state,
        collection: previousCollection,
        histories: {
            past: newPast,
            future: newFuture
        },
        // Clear selection to prevent references to deleted nodes
        selected: new Set(),
        hovered: new Set()
    };
};

/**
 * Performs REDO: moves current state to past, restores next future state.
 */
const applyRedo = (state: NodeState): NodeState => {
    const { past, future } = state.histories;
    if (future.length === 0) {
        console.log("No thing to redo");
        return state; // Nothing to redo
    }

    const nextCollection = future[0];
    const newFuture = future.slice(1);
    const newPast = [...past, state.collection];

    return {
        ...state,
        collection: nextCollection,
        histories: {
            past: newPast,
            future: newFuture
        },
        selected: new Set(),
        hovered: new Set()
    };
};


export const nodeReducer = (state: NodeState, action: NodeReducerAction): NodeState => {
    switch (action.type) {

        case "UNDO":
            console.log("Undo History")
            return applyUndo(state);

        case "REDO":
            console.log("Redo History")
            return applyRedo(state);

        case "CLEAR_HISTORY": {
            console.log("History Cleared");
            return applyResetHistory(state);
        }

        case "SET_STATUS": {
            return applyResetHistory({
                ...state,
                status: action.payload
            });
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
            return applyResetHistory({ ...state, collection: newNodes });
        }

        // --- NODE MANAGEMENT ---
        case "ADD_NODE": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;
            const newNodes = new Map(state.collection);
            const newNode = new NodeModel(action.payload);
            newNodes.set(newNode.id, newNode);

            // newNode.type.model.onCreate?.(newNode, newNodes);
            return {
                ...state,
                histories: pushHistory(state),
                collection: newNodes
            }
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
            const targetParentId = position === "inside" ? targetNode.id : targetNode.parent || ROOT_NODE.id;

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
                histories: pushHistory(state),
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
            const sourceNode = state.collection.get(sourceId);
            const targetNode = state.collection.get(targetId);

            if (!sourceNode || !targetNode) {
                console.warn(`Source or target node not found for MOVE_NODE action.`);
                return state;
            }

            const newNodes = new Map(state.collection);

            // 2. Determine parents exactly as INSERT_BLOCK does
            const targetParentId = position === "inside"
                ? targetNode.id
                : (targetNode.parent || ROOT_NODE.id);

            const oldParentId = sourceNode.parent || ROOT_NODE.id;

            // 3. Get old siblings and REMOVE the source node from them first
            let oldSiblings = Array.from(newNodes.values())
                .filter(n => (n.parent || ROOT_NODE.id) === oldParentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            oldSiblings = oldSiblings.filter(n => n.id !== sourceId); // 🛑 Crucial step!

            // 4. Prepare the target siblings list
            let targetSiblings: NodeModel[];
            if (oldParentId === targetParentId) {
                targetSiblings = oldSiblings;
            } else {
                targetSiblings = Array.from(newNodes.values())
                    .filter(n => (n.parent || ROOT_NODE.id) === targetParentId)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));
            }

            // 5. Update the source node's parent reference
            // ✅ FIX: Assign the targetParentId directly to maintain the ROOT_NODE.id reference
            const updatedSourceNode = new NodeModel(sourceNode);
            updatedSourceNode.parent = targetParentId;

            // 6. Insert the node based on the position
            if (position === "inside") {
                targetSiblings.push(updatedSourceNode);
            } else {
                const targetIndex = targetSiblings.findIndex(node => node.id === targetId);

                if (targetIndex !== -1) {
                    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
                    targetSiblings.splice(insertIndex, 0, updatedSourceNode);
                } else {
                    targetSiblings.push(updatedSourceNode); // Failsafe
                }
            }

            // 7. Reassign sequential `order` numbers (0, 1, 2...) and save to map
            targetSiblings.forEach((node, index) => {
                const updatedNode = new NodeModel(node);
                updatedNode.order = index;
                newNodes.set(node.id, updatedNode);
            });

            // 8. If the node was moved to a DIFFERENT parent, re-index the old parent's remaining children
            if (oldParentId !== targetParentId) {
                oldSiblings.forEach((node, index) => {
                    const updatedNode = new NodeModel(node);
                    updatedNode.order = index;
                    newNodes.set(node.id, updatedNode);
                });
            }

            // 9. Return updated state
            return {
                ...state,
                histories: pushHistory(state),
                collection: newNodes
            };
        }

        case "UPDATE_NODE": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

            const node = state.collection.get(action.payload.id) ? new NodeModel(state.collection.get(action.payload.id)!) : null;
            if (!node) return state

            const newNodes = new Map(state.collection);

            let shouldHistoryPropagate = false;

            if ("dom" in action.payload && action.payload !== undefined) { // Nullable
                node.dom = action.payload.dom;
            }
            if ("name" in action.payload && action.payload.name !== undefined) {
                node.name = action.payload.name;
            }
            if ("props" in action.payload && action.payload.props !== undefined) {
                node.props = {
                    ...node.props,
                    ...action.payload.props
                };
                shouldHistoryPropagate = true;
            }
            if ("content" in action.payload) { // Nillable
                node.content = action.payload.content;
                shouldHistoryPropagate = true;
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
            if ("deletable" in action.payload && action.payload.deletable !== undefined) {
                node.deletable = Boolean(action.payload.deletable);
            }
            if ("data" in action.payload && action.payload.data) {
                node.data = action.payload.data as any;
            }

            newNodes.set(action.payload.id, node);

            if (shouldHistoryPropagate) {
                return {
                    ...state,
                    histories: pushHistory(state),
                    collection: newNodes
                }
            }
            return {
                ...state,
                collection: newNodes
            }
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
            return {
                ...state,
                histories: pushHistory(state),
                collection: newNodes
            };
        }

        case "DELETE_NODE": {
            // editing protection: only allow block insertion when in "editing" mode
            if (state.status !== "editing") return state;

            // the target to delete
            const targetNode = state.collection.get(action.payload)
            if (!targetNode) return state;
            if (targetNode.type.name.toLowerCase() === ROOT_NODE.type) {
                console.warn("Cannot remove DOM reference for the Root node.");
                return state;
            }

            const newNodes = new Map(state.collection);
            const nodesToDelete = getNodeDescendants(targetNode, newNodes);
            const newHovered = new Set(state.hovered);
            const newSelected = new Set(state.selected);

            for (const [id] of nodesToDelete) {
                newNodes.delete(id);
                newHovered.delete(id);
                newSelected.delete(id);
            }
            newNodes.delete(targetNode.id);
            newHovered.delete(targetNode.id);
            newSelected.delete(targetNode.id);

            return {
                ...state,
                histories: pushHistory(state),
                collection: newNodes,
                hovered: newHovered,
                selected: newSelected
            }
        }

        case "SET_NODE_CHILDREN": {
            if (state.status !== "editing") return state;
            const target = state.collection.get(action.payload.id) ? new NodeModel(state.collection.get(action.payload.id)!) : null;
            if (!target) {
                console.warn(`REDUCER SET_NODE_CHILDREN: Target node not found for action.`);
                return state;
            }

            let newNodes = new Map(state.collection);

            // Collect ALL descendants (including nested ones)
            const oldDescendantIds = getNodeDescendants(target, newNodes);
            for (const [id] of oldDescendantIds) {
                if (id === target.id) continue; // self protection
                newNodes.delete(id);
            }

            action.payload.children.forEach((child) => {
                const childNode = new NodeModel(child);
                if (childNode.parent == null) {
                    childNode.parent = target.id;
                }
                newNodes.set(childNode.id, childNode);
            });

            // remove parentle nodes
            purgeOrphanNodes(newNodes);

            return {
                ...state,
                histories: pushHistory(state),
                collection: newNodes
            };
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

            return {
                ...state,
                histories: pushHistory(state),
                variables: newVariables
            };
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

            return {
                ...state,
                histories: pushHistory(state),
                variables: newVariables
            };
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

            return {
                ...state,
                histories: pushHistory(state),
                variables: newVariables
            };
        }


        // --- NON-HISTORIC ACTIONS ---
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

        // --- NON-HISTORIC ACTIONS ---
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

        // --- NON-HISTORIC ACTIONS ---
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
            // Push history snapshot once before starting the bulk execution
            const stateWithHistory = {
                ...state,
                histories: pushHistory(state)
            };

            console.log("Collect History");

            return action.payload.reduce((currentState, bulkAction) => {
                if (bulkAction.type === "BULK") {
                    console.warn("Nested BULK actions are not allowed. Ignoring this action.");
                    return currentState;
                }

                console.log("Bulk Action");

                // Temporary override to avoid pushing multiple history entries during bulk operations
                const resultState = nodeReducer(currentState, bulkAction);
                return {
                    ...resultState,
                    histories: stateWithHistory.histories
                };
            }, stateWithHistory);
        }


        default:
            return state
    }
}