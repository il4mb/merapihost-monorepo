import { IconButton, Stack, Tooltip } from "@mui/material";
import { ModelContext, NodeModel } from "@nodes/cores";
import { ActivitySquare } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TypeAction } from "@/types";
import { useNodeCollectionRef, useNodes } from "@/contexts";

type NodeActionItem = TypeAction & { id: string; title?: string };
type NodeActionsProps = {
    node: NodeModel;
};

export default function NodeActions({ node }: NodeActionsProps) {
    const { dispatch } = useNodes();
    const collectionRef = useNodeCollectionRef();
    const [actions, setActions] = useState<NodeActionItem[]>([]);

    useEffect(() => {
        const nextActions = node.type.actions.filter(e => e.visible !== false);
        setActions(nextActions);
    }, [node.data]);

    const handleClick = useCallback((id: string) => {
        const action = actions.find(a => a.id == id);
        if (action.disabled) return;
        node.type.invokeCommand(
            id,
            new ModelContext(
                dispatch,
                collectionRef.current
            )
        );
    }, [node.type, actions]);

    return (
        <Stack direction={"row"} sx={{ ml: 2, gap: 0, borderRadius: .2, overflow: "hidden" }}>
            {actions.map(act => (
                <Tooltip key={act.id} title={act.title} arrow>
                    <IconButton
                        disabled={act.disabled}
                        onClick={() => handleClick(act.id)}
                        size="small"
                        sx={{
                            color: "#fff",
                            background: act.active ? "#00224993" : "#07326302",
                            borderRadius: 0,
                            "&:hover": {
                                background: act.active ? "#00224993" : "#1c5ca5",
                            }
                        }}>
                        {act.icon ? (<act.icon size={12} />) : <ActivitySquare size={12} />}
                    </IconButton>
                </Tooltip>
            ))}
        </Stack>
    );
}
