import { useEffect, useMemo, useRef, useState } from "react"
import { useEditor, useNodes } from "../cores/EditorProvider"
import { NodeObject } from "../type"

export const useNodesBy = (ids: string[]): NodeObject[] => {
    const allNodes = useNodes()
    const stableIds = ids.join(",")
    const nodes = useMemo(() => {
        return ids.map(id => allNodes.find(n => n.id === id)).filter(Boolean)
    }, [stableIds, allNodes])
    return useMemo(() => nodes as NodeObject[], [nodes])
}

export const useSelectedNodes = (): NodeObject[] => {
    const { state } = useEditor()
    const allNodes = useNodes()
    const [nodes, setNodes] = useState(Array.from(state.nodes.values()))
    const arraySelectedNodesRef = useRef(Array.from(state.selected))

    useEffect(() => {
        const selectedNodes = Array.from(state.selected)
        const incomingIds = new Set(selectedNodes)
        const currentIds = new Set(arraySelectedNodesRef.current)
        let hasChange = false
        if (incomingIds.size !== currentIds.size) {
            hasChange = true
        } else {
            for (const id of incomingIds) {
                if (!currentIds.has(id)) {
                    hasChange = true
                    break
                }
            }
        }
        if (hasChange) {
            arraySelectedNodesRef.current = selectedNodes
            setNodes(selectedNodes.map(id => allNodes.find(n => n.id === id)).filter(Boolean) as NodeObject[])
        }
    }, [state.selected, allNodes])
    return nodes as NodeObject[];
}