import { styled, Typography, Box, Stack } from "@mui/material";
import { memo, useEffect, useMemo, useState } from "react";
import { NodeObject } from "../../../types/node";
import { useNodeName, useNodeVisibility, useSelectedNodes, useTypeContext } from "../../../hooks/useNodes";
import { Square } from "lucide-react";
import TextField from "../../components/TextField";
import Switch from "../../components/Switch";

const ScrollContainer = styled("div")({
    width: "100%",
    height: "100%",
    overflowY: "auto",
    "&::-webkit-scrollbar": {
        width: "6px"
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: "3px"
    },
    "&::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "rgba(0,0,0,0.3)"
    }
})

export default function SettingsManager() {

    const [mounted, setMounted] = useState(false);
    const selectedNodes = useSelectedNodes();


    useEffect(() => {
        if (mounted) return;
        setMounted(true);
    }, [selectedNodes.length]);

    if (!mounted) return null;
    if (selectedNodes.length === 0 || selectedNodes.length > 1) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    {selectedNodes.length === 0 ? "Select a node to view its settings" : "Multiple nodes selected. Please select a single node to view its settings."}
                </Typography>
            </Box>
        );
    }
    return (
        <ScrollContainer>
            <SettingContent node={selectedNodes[0]} />
        </ScrollContainer>
    );
}

const SettingContent = memo(({ node }: { node: NodeObject }) => {

    const typeContext = useTypeContext(node.id);
    const IconComponent = typeContext.type?.model?.icon || Square;
    const [name, setName] = useNodeName(node.id);
    const { visible, canToggle, setVisibility } = useNodeVisibility(node.id);

    const defaultName = useMemo(() => {
        if (!typeContext.type?.model.default?.name) return node.type || node.tagName || "Name";
        if (typeof typeContext.type.model.default.name === "string") {
            return typeContext.type.model.default.name;
        }
        return typeContext.type.model.default.name.call(typeContext);
    }, [typeContext, node.type]);

    const toggleVisibility = (visible: boolean) => {
        console.log("Toggling visibility for node:", node.id, "to", visible);
        setVisibility(visible);
    }

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <IconComponent
                    color={typeContext.type?.model?.color}
                    size={16} />
                <Typography sx={{ ml: .5, fontWeight: 600 }}>
                    {typeContext.type?.model?.name || "Unknown Type"}
                </Typography>
            </Box>
            <Stack spacing={1}>
                <Stack spacing={1} direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Typography>
                        Name
                    </Typography>
                    <TextField
                        sx={{ flex: '0 1 70%' }}
                        placeholder={defaultName}
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                    />
                </Stack>
                <Stack spacing={1} direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Typography>
                        Visible
                    </Typography>
                    <Switch
                        checked={visible}
                        disabled={!canToggle}
                        onChange={toggleVisibility}
                    />
                </Stack>
            </Stack>
        </Box>
    );
});