import { Box } from "@mui/material";
import { memo } from "react";
import { ModifierSet } from "../type";
import Modifier from "./Modifier";

/**
 * Prevents unnecessary re-renders by memoizing the entire stack of modifiers. 
 * Each modifier component will still receive updated props when the selected nodes change, but the stack itself won't re-render unless the set of modifiers changes (i.e., different models or different selected nodes).
 */
type Props = {
    modifiers: ModifierSet[];
};
const ModifierStack = memo(({ modifiers }: Props) => {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {modifiers.map((modSet, index) => (
                <Modifier
                    key={index}
                    index={index}
                    modifier={modSet.modifier}
                    nodeIds={modSet.nodeIds} />
            ))}
        </Box>
    );
});

ModifierStack.displayName = "ModifierStack";
export default ModifierStack;