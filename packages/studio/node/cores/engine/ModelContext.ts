import { NodeUpdateInput } from "@/types";
import { Dispatch } from "react";
import { NodeModel } from "@nodes";
// import { NodeReducerAction } from "../../src/libs/reducers";
import { getNodeChildren, getNodeAncestors, getNodeDescendants, getNodeSiblings } from "../tools";

type NodeReducerAction = {
    type: string;
    payload?: any;
};

export class ModelContext {

    private node: NodeModel;
    private pendingActions: NodeReducerAction[] = [];
    private isScheduled = false;
    private dispatchBatched(action: NodeReducerAction) {
        this.pendingActions.push(action);

        if (!this.isScheduled) {
            this.isScheduled = true;
            queueMicrotask(() => {
                if (this.pendingActions.length === 1) {
                    // Just one action? Dispatch normally.
                    this.dispatch(this.pendingActions[0]);
                } else if (this.pendingActions.length > 1) {
                    // Multiple actions? Bundle them into a BULK type.
                    this.dispatch({
                        type: "BULK",
                        payload: this.pendingActions // Pass the array of actions
                    });
                }

                // Reset the queue for the next cycle
                this.pendingActions = [];
                this.isScheduled = false;
            });
        }
    };

    constructor(private dispatch: Dispatch<NodeReducerAction>, private collection: Map<string, NodeModel>) { }

    findNode(id: string) {
        return this.collection.has(id) ? this.collection.get(id) : null;
    }
    getChildren() {
        return getNodeChildren(this.node, this.collection);
    }
    getAncestors() {
        return getNodeAncestors(this.node, this.collection);
    }
    getDescendants() {
        return getNodeDescendants(this.node, this.collection);
    }
    getSiblings() {
        return getNodeSiblings(this.node, this.collection);
    }
    getParent() {
        return this.collection.get(this.node.parent);
    }

    updateChildren(children: Map<string, NodeModel>) {
        this.dispatchBatched({
            type: "SET_NODE_CHILDREN",
            payload: { id: this.node.id, children }
        });
    }
    update(patch: NodeUpdateInput) {
        this.dispatchBatched({
            type: "UPDATE_NODE",
            payload: { ...patch, id: this.node.id }
        });
    }
    delete() {
        this.dispatchBatched({
            type: "DELETE_NODE",
            payload: this.node.id
        });
    }
    select() {
        this.dispatchBatched({
            type: "SET_SELECTED",
            payload: this.node.id
        });
    }

    command(id: string, props?: any) {
        return this.node.type.invokeCommand(id, this, props);
    }

    withNode<T>(tempNode: NodeModel, action: () => T): T {
        const previousNode = this.node;
        this.node = tempNode;

        try {
            return action();
        } finally {
            this.node = previousNode;
        }
    }
}
