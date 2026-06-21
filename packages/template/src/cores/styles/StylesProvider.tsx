import { memo, useEffect, useMemo, useState } from "react";
import { useSelectedNodes } from "../../hooks/useNodes";
import { useModelsFromArray } from "../../hooks/useResolver";
import { Box } from "@mui/material";
import { ModifierComponent } from "../../type";

type ModSet = {
    component: ModifierComponent,
    nodes: Set<string> // Set of node IDs that this modifier applies to

}

interface StylesProviderProps {
    children?: React.ReactNode
}

export default function StylesProvider({ children }: StylesProviderProps) {

    const nodes = useSelectedNodes();
    const nodeTypes = nodes.map(node => node.data.type);
    const models = useModelsFromArray(nodeTypes);
    const [modifiers, setModifiers] = useState<ModSet[]>([])

    const stableNodeIds = nodes.map(n => n.id).join(",")
    const stableModelNames = models.map(m => m.name).join(",")
    const lastSignature = useMemo(() => `${stableNodeIds}|${stableModelNames}`, [stableNodeIds, stableModelNames])

    useEffect(() => {
        const modifiers = [] as ModSet[]
        models.forEach(model => {
            const nodeIds = nodes.filter(node => node.data.type === model.name).map(node => node.id)
            const modelModifiers = Object.values(model.model.related || {}) as ModifierComponent[]
            modelModifiers.forEach(modifier => {
                const existing = modifiers.find(mod => mod.component === modifier)
                if (existing) {
                    nodeIds.forEach(id => existing.nodes.add(id))
                } else {
                    modifiers.push({ component: modifier, nodes: new Set(nodeIds) })
                }
            })
        })
        setModifiers(modifiers)
    }, [lastSignature]) // Re-run whenever the selected nodes or their models change

    return (
        <div>
            {children}
            <ModifierStack modifiers={modifiers} />
        </div>
    );
}


/**
 * Prevents unnecessary re-renders by memoizing the entire stack of modifiers. 
 * Each modifier component will still receive updated props when the selected nodes change, but the stack itself won't re-render unless the set of modifiers changes (i.e., different models or different selected nodes).
 */
const ModifierStack: React.FC<{ modifiers: ModSet[] }> = memo(({ modifiers }) => {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {modifiers.map((modSet, index) => {
                const ModComponent = modSet.component
                return (
                    <ModComponent
                        key={index}
                        value={modSet.nodes}
                        nodeIds={Array.from(modSet.nodes)} />
                )
            })}
        </Box>
    )
})