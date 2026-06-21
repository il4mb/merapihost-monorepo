import { ElementType, useMemo } from "react"
import { useEditor } from "../cores/EditorProvider"
import { Component } from "../type"
import { NodeObject } from "../types/node"
import { useNode } from "../cores/Element"
import { Root } from "../base/Root"
import { Element } from "../components/Element"

export const useModelRegistry = () => {
    const { state } = useEditor()
    return useMemo<Record<string, Component>>(() => {
        return { ...state.resolver, Root, Element: Element }
    }, [state.resolver])
}


export const useModelsFromArray = (names: string[]) => {
    const registry = useModelRegistry()
    const stableNames = useMemo(() => names, [names.join(",")])
    return useMemo(() => {
        return stableNames.map(name => {
            return Object.values(registry).find(comp => comp.model.name === name)
        }).filter((v): v is Component => !!v)
    }, [registry, stableNames])
}


type ResolverResult = {
    isLinkedComponent: boolean
    isModel: boolean
    displayName: string
    component: ElementType | null
    rules: {
        canMove: (node: NodeObject) => boolean
        canResize: (node: NodeObject) => boolean
        canDrag: (node: NodeObject) => boolean
        canDrop: (node: NodeObject, targetNode: NodeObject) => boolean
    }
}

// export const useModelResolver = (node?: NodeObject): ResolverResult => {
//     const { state } = useEditor()
//     const currentNode = node || useNode()

//     const owner = useMemo(() => {
//         if (!currentNode?.data.parent) return null
//         let parentNode = state.nodes.get(currentNode?.data.parent)
//         while (parentNode) {
//             const parentType = parentNode.data.type
//             const isModel = Object.values(state.resolver).some(comp => comp === parentType)
//             if (isModel) {
//                 return parentNode
//             }
//             if (!parentNode.data.parent) {
//                 break
//             }
//             parentNode = state.nodes.get(parentNode.data.parent) || undefined
//         }
//         return null
//     }, [state.nodes, state.resolver, node?.id])

//     return useMemo(() => {
//         const type = currentNode?.data?.type
//         if (typeof type === "string") {
//             return {
//                 isLinkedComponent: false,
//                 isModel: false,
//                 displayName: type,
//                 component: type as ElementType,
//                 rules: {
//                     canMove: () => true,
//                     canResize: () => true,
//                     canDrag: () => true,
//                     canDrop: () => true
//                 }
//             }
//         } else {
//             const resolvedComponent = Object.values(state.resolver).find(
//                 comp => comp === type
//             )
//             if (resolvedComponent) {
//                 return {
//                     isLinkedComponent: false,
//                     isModel: true,
//                     displayName: resolvedComponent.model.name,
//                     component: resolvedComponent,
//                     // rules: resolvedComponent.model.rules || {
//                     //     canMove: () => true,
//                     //     canResize: () => true,
//                     //     canDrag: () => true,
//                     //     canDrop: () => true
//                     // }
//                 }
//             } else if (type && owner) {
//                 // const linkedComponent = owner.linkedComponents?.find(c => c === type)
//                 // if (linkedComponent) {
//                 //     return {
//                 //         isLinkedComponent: true,
//                 //         isModel: false,
//                 //         displayName:
//                 //             typeof linkedComponent === "string"
//                 //                 ? linkedComponent
//                 //                 : linkedComponent.name || "Unknown",
//                 //         component: linkedComponent,
//                 //         rules: {
//                 //             canMove: () => true,
//                 //             canResize: () => true,
//                 //             canDrag: () => true,
//                 //             canDrop: () => true
//                 //         }
//                 //     }
//                 // }
//             }
//             return {
//                 isLinkedComponent: false,
//                 isModel: false,
//                 // @ts-ignore
//                 displayName: type?.name || type?.render?.name || "Unknown",
//                 component: null,
//                 rules: {
//                     canMove: () => true,
//                     canResize: () => true,
//                     canDrag: () => true,
//                     canDrop: () => true
//                 }
//             }
//         }
//     }, [state.resolver, currentNode?.data?.type, owner])
// }
