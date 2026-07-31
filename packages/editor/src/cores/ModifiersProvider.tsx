import { createContext, memo, useContext, useEffect, useMemo, useState } from "react";
import { ModifierComponent, ModifierSet } from "../type";
import { useModelRegistry, useModelsFromArray } from "../hooks/useResolver";
import ModifierStack from "./ModifierStack";
import { useSelectedNodes } from "./EditorProvider";
import { Box, Typography } from "@mui/material";
import { useTypeRegistry } from "./TypeRegistry";

type Group = {
    label: string;
    modifiers: ModifierSet[];
    subs: Group[];
};

// Recursive component to render groups and their nested sub-groups
const RenderGroup = memo(({ group, depth = 0 }: { group: Group; depth?: number }) => {
    return (
        <Box> {/* Indent based on depth */}
            <Typography
                variant={depth === 0 ? "h6" : "subtitle2"}
                color={depth === 0 ? "text.primary" : "text.secondary"}
                gutterBottom>
                {group.label}
            </Typography>

            {/* Render modifiers if this specific group level has any */}
            {group.modifiers.length > 0 && (
                <Box sx={{ mb: 1 }}>
                    <ModifierStack modifiers={group.modifiers} />
                </Box>
            )}

            {/* Recursively render child groups */}
            {group.subs.map((subGroup) => (
                <RenderGroup key={subGroup.label} group={subGroup} depth={depth + 1} />
            ))}
        </Box>
    );
});

export default function ModifiersProvider() {
    const { registries } = useTypeRegistry();
    const nodes = useSelectedNodes();
    const nodeSignature = nodes.map(n => n.id).join(",");
    const nodeTypes = nodes.map(node => node.data.type);
    const models = useModelsFromArray(nodeTypes);
    const [modifiers, setModifiers] = useState<ModifierSet[]>([]);

    const groupedTree = useMemo(() => {
        const root: Group[] = [];

        modifiers.forEach(mod => {
            const categoryPath = mod.modifier.modifier.category || "General";
            const parts = categoryPath.split('/').filter(Boolean); // split by slash and remove empty strings

            let currentLevel = root;
            let currentGroup: Group | undefined;

            parts.forEach((part) => {
                let existingGroup = currentLevel.find(g => g.label === part);

                if (!existingGroup) {
                    existingGroup = {
                        label: part,
                        modifiers: [],
                        subs: []
                    };
                    currentLevel.push(existingGroup);
                }

                currentGroup = existingGroup;
                currentLevel = existingGroup.subs;
            });

            if (currentGroup) {
                currentGroup.modifiers.push(mod);
            }
        });

        return root;
    }, [modifiers]);

    const stableNodeIds = nodes.map(n => n.id).join(",");
    const stableModelNames = models.map(m => m.name).join(",");
    const lastSignature = useMemo(() => `${stableNodeIds}|${stableModelNames}`, [stableNodeIds, stableModelNames]);

    useEffect(() => {
        const newModifiers = [] as ModifierSet[];

        models.forEach(model => {
            const nodeIds = nodes.filter(node => node.data.type === model.name).map(node => node.id);
            const modelModifiers = Object.values(model.model.related || {}) as ModifierComponent[];
            const extendsModifiers = model.model.extends ? registries[model.model.extends]?.model.related : null;
            if (extendsModifiers) {
                modelModifiers.push(...Object.values(extendsModifiers) as ModifierComponent[]);
            }

            modelModifiers.forEach(modifier => {
                const existing = newModifiers.find(mod => mod.modifier === modifier);
                if (existing) {
                    nodeIds.forEach(id => {
                        // Avoid duplicates
                        if (!existing.nodeIds.includes(id)) {
                            existing.nodeIds.push(id);
                        }
                    });
                } else {
                    newModifiers.push({ modifier, nodeIds: [...nodeIds] });
                }
            });
        });
        setModifiers(newModifiers.filter(mod => mod.nodeIds.length > 0));
    }, [lastSignature, models, nodeSignature, registries]);

    // useEffect(() => {
    //     console.log("Modifiers updated:", modifiers);
    // }, [modifiers]);

    return (
        <Context.Provider value={modifiers}>
            {groupedTree.map(rootGroup => (
                <RenderGroup key={rootGroup.label} group={rootGroup} />
            ))}
        </Context.Provider>
    );
}

const Context = createContext<ModifierSet[]>([]);

export const useModifiers = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error("useModifiers must be used within a ModifiersProvider");
    }
    return context;
};