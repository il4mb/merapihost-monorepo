import { createContext, useCallback, useContext, useMemo } from "react"
import { NodeObject } from "../types/node"

/***
 * NodeOwnerProvider is a context provider that allows components to access their owning node in the editor's state.
 * This is particularly useful for components that define in custom user components
 */

interface Props {
    children: React.ReactNode
    node: NodeObject
    onLinkedNode?: (linkedNodeId: string, elementId: string) => void
}
export default function NodeOwnerProvider({ children, node, onLinkedNode }: Props) {

    const handleLinkedNode = useCallback((linkedNodeId: string, elementId: string) => {
        if (onLinkedNode) {
            onLinkedNode(linkedNodeId, elementId)
        }
    }, [onLinkedNode])

    const value = useMemo(() => ({
        ...node,
        linkNode: handleLinkedNode
    }), [node, handleLinkedNode])

    return (
        <NodeOwnerContext.Provider value={value}>
            {children}
        </NodeOwnerContext.Provider>
    )
}


type NodeOwner = NodeObject & {
    linkNode: (linkedNodeId: string, elementId: string) => void
}

const NodeOwnerContext = createContext<NodeOwner | null>(null)

export const useNodeOwner = () => {
    return useContext(NodeOwnerContext)
}