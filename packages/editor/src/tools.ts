import { ElementType, FC } from "react"
import { Modifier, ModifierComponent, ModifierComponentProps, TypeComponent, TypeModel } from "./type"

export const cleanObject = (obj: Record<string, any>, removeNull = false): Record<string, any> => {
    const cleaned: Record<string, any> = {};

    for (const key in obj) {
        const value = obj[key];

        // 1. Skip undefined, and skip null if removeNull is true
        if (value === undefined || (removeNull && value === null)) {
            continue;
        }

        // 2. Handle nested objects recursively (excluding nulls and Arrays)
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const nestedCleaned = cleanObject(value, removeNull);

            // Only assign if the nested object isn't empty 
            if (Object.keys(nestedCleaned).length > 0) {
                cleaned[key] = nestedCleaned;
            }
        }
        // 3. Handle Arrays (optionally deep-clean their contents too)
        else if (Array.isArray(value)) {
            // Keep arrays as they are, but you could map over them here if you want to deep-clean objects inside arrays
            cleaned[key] = value;
        }
        // 4. Handle primitives (strings, numbers, booleans) and nulls (if removeNull is false)
        else {
            cleaned[key] = value;
        }
    }

    return cleaned;
}

export function createModifierComponent<T>(
    modifier: Modifier<T>,
    Component: React.FC<ModifierComponentProps<T>>
): ModifierComponent<T> {
    return Object.assign(Component, { modifier });
}

export const getNodeOwner = (
    node: BlockNode,
    nodes: Map<string, BlockNode>,
    models: ElementType[]
): BlockNode | null => {
    if (node.data.parent) {
        let parent = nodes.get(node.data.parent)
        while (parent) {
            const parentType = parent.data.type
            const isModel = models.some(model => model === parentType)
            if (isModel) {
                return parent
            }
            if (!parent.data.parent) {
                break
            }
            parent = nodes.get(parent.data.parent)
        }
    }
    return null
}


export const createType = <T>(fc: FC<T & { ref?: React.Ref<HTMLElement> }>, model: TypeModel<T>): TypeComponent<T> => {
    // @ts-ignore
    return Object.assign(fc, { model });
}