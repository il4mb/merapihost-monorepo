import { createContext, useContext } from "react";
import { NodeModel } from "@nodes";

type ModelContext = {
    findNode: (id: string) => NodeModel | null;
    getChildren: () => NodeModel[];
    getAncestors: () => NodeModel[];
    getDescendants: () => NodeModel[];
    getSiblings: () => NodeModel[];
    getParent: () => NodeModel | undefined;
    updateChildren: (children: Map<string, NodeModel>) => void;
    update: (patch: Partial<NodeModel>) => void;
};

const NodesContext = createContext<ModelContext | null>(null);
export const useNodesContext = () => {
    const context = useContext(NodesContext);
    if (!context) {
        throw new Error("useNodesContext must be used within a NodesProvider");
    }
    return context;
};

type NodesProviderProps = {};

export default function NodesProvider({}: NodesProviderProps) {
    return (
        <div>
            {/* NodesProvider content goes here */}
            <h1>NodesProvider</h1>
        </div>
    );
}
