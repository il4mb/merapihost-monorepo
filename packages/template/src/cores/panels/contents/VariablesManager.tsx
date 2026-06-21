import { Box, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import { Fragment, memo, useCallback, useMemo, useRef, useState } from "react";
import { NodeObject, Variable } from "../../../types/node";
import { useNodeVariables } from "../../../hooks/useNodes";
import { Plus } from "lucide-react";
import WindowDialog from "../../WindowDialog";
import VariableForm from "../../components/VariableForm";

const VariablesManager = memo(({ node }: { node: NodeObject }) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const { variables, setVariable } = useNodeVariables(node.id);
    const sortedVariables = useMemo(() => {
        return [...variables].sort((a, b) => {
            const aLocal = a.nodeId === node.id;
            const bLocal = b.nodeId === node.id;

            if (aLocal && !bLocal) return -1;
            if (!aLocal && bLocal) return 1;

            return a.name.localeCompare(b.name);
        });
    }, [variables, node.id]);

    const [adding, setAdding] = useState(false);
    const [data, setData] = useState<Record<string, any>>({
        name: "",
        type: "string"
    });

    const showAddingDialog = () => {
        setAdding(true);
    }

    const handleCloseDialog = useCallback(() => {
        console.log("data", data);
        setAdding(false);
        if (!data.name || !data.type) {
            setData({
                name: "",
                type: "string"
            });
            return;
        }
        setVariable(data as Variable);
        setData({
            name: "",
            type: "string"
        });
    }, [data, setVariable]);

    return (
        <Fragment>
            <Box ref={containerRef}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography sx={{ ml: .5, fontWeight: 600 }}>
                        Variables
                    </Typography>
                    <IconButton size="small" onClick={showAddingDialog}>
                        <Plus size={16} />
                    </IconButton>
                </Box>
                <Stack spacing={0.25}>
                    {sortedVariables.map(v => {
                        const isLocal = v.nodeId === node.id;
                        const value = typeof v.value === "object" ? JSON.stringify(v.value) : String(v.value ?? "");

                        return (
                            <Box
                                key={`${v.nodeId}-${v.name}`}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    px: 0.5,
                                    py: 0.25,
                                    borderRadius: 1,
                                    bgcolor: isLocal
                                        ? "action.selected"
                                        : "transparent"
                                }}>
                                <Box
                                    sx={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: "50%",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        bgcolor: isLocal
                                            ? "primary.main"
                                            : "action.disabled",
                                        color: "primary.contrastText",
                                        flexShrink: 0
                                    }}>
                                    {isLocal ? "L" : "P"}
                                </Box>

                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {v.name}
                                </Typography>

                                <Typography
                                    variant="body2"
                                    color={value ? "text.secondary" : "warning.main"}
                                    sx={{
                                        flex: 1,
                                        minWidth: 0,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        fontFamily: "monospace",
                                        fontStyle: value ? "normal" : "italic",
                                        fontSize: 11,
                                        textAlign: "right"
                                    }}>
                                    {value || "No value"}
                                </Typography>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>
            <WindowDialog
                title={
                    <Typography sx={{ fontWeight: 600 }}>
                        Variables
                    </Typography>
                }
                open={adding}
                onClose={handleCloseDialog}
                anchor={containerRef}
                width={400}
                height={300}
                autoGrowthLayout={"vertical"}
                movable
                ancorOffset={{ x: 20, y: 10 }}
                ancorOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}>
                <VariableForm data={data} onChange={setData} />
            </WindowDialog>
        </Fragment>
    );
});

VariablesManager.displayName = "VariablesManager";
export default VariablesManager;