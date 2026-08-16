import { IconButton, Stack, Tooltip } from "@mui/material";
import { NodeModel } from ".";
import { ActivitySquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TypeAction } from "@/types";

type NodeActionItem = TypeAction & { id: string; title?: string };
type NodeActionsProps = {
    node: NodeModel;
};

export default function NodeActions({ node }: NodeActionsProps) {
    const [actions, setActions] = useState<NodeActionItem[]>([]);
    const prevActionsRef = useRef<NodeActionItem[]>([]);

    useEffect(() => {
        const nextActions = node.type.actions;
        setActions(nextActions);
    }, [node.data]);

    const handleClick = (id: string) => {
        node.type.invokeCommand(id);
    }
    return (
        <Stack direction={"row"} sx={{ ml: 2, gap: 0, borderRadius: .2, overflow: "hidden" }}>
            {actions.map(act => (
                <Tooltip key={act.id} title={act.title} arrow>
                    <IconButton
                        onClick={() => handleClick(act.id)}
                        size="small"
                        sx={{
                            color: "#fff",
                            background: act.active ? "#00224993" : "#07326302",
                            borderRadius: 0
                        }}>
                        {act.icon ? (<act.icon size={12} />) : <ActivitySquare size={12} />}
                    </IconButton>
                </Tooltip>
            ))}
        </Stack>
    );
}
