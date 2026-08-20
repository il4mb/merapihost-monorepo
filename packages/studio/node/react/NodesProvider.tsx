import { createContext, useContext } from "react";
import { Node } from "@nodes";

type ModelContext = {
    findNode: (id: string) => Node | null;
    getChildren: () => Node[];
    getAncestors: () => Node[];
    getDescendants: () => Node[];
    getSiblings: () => Node[];
    getParent: () => Node | undefined;
    updateChildren: (children: Map<string, Node>) => void;
    update: (patch: Partial<Node>) => void;
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
