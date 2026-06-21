import { Box, styled, SxProps, Tooltip, Typography } from "@mui/material";
import { ModifierComponent } from "../type";
import { AlertTriangle, Diamond, DiamondPlus, XIcon } from "lucide-react";
import { useEditor, useSelectedNodes } from "./EditorProvider";
import { AnimatePresence, motion } from "motion/react";
import { useNodesBy } from "../hooks/useNodes";
import { createContext, createRef, Fragment, memo, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LabelWidget from "./styles/components/LabelWidget";
import ActionWidget from "./styles/components/ActionWidget";

const Row = styled(motion.div)(({ theme }) => ({
    display: "flex",
    flexDirection: "row",
    gap: theme.spacing(1),
    justifyContent: "flex-end",
    flex: 1
}));

interface ModifierProps {
    modifier: ModifierComponent
    nodeIds: string[]
    index: number
}

export default function Modifier({ modifier, nodeIds, index }: ModifierProps) {

    const { dispatch } = useEditor();
    const Component = modifier;
    const nodes = useNodesBy(nodeIds);
    const stableNodeIds = useMemo(() => nodes.map(n => n.id).sort().join(","), [nodes]);

    const allValues = useMemo(() => {
        if (!nodes || nodes.length === 0) return null;
        return nodes.map(node => modifier.modifier.onRetrieve(node.data.props || {}));
    }, [stableNodeIds]); // Recalculate allValues whenever the set of nodes changes, but not on every render.

    const [delay, setDelay] = useState(index * 0.1);
    const [mounted, setMounted] = useState(false);
    const [calculating, setCalculating] = useState(true);
    const mountedRef = useRef(false);
    const [value, setValue] = useState<any>(null);

    const isNullable = modifier.modifier.nullable;

    // Keep the mounting state in a ref to prevent it from causing re-renders when we update it.
    useEffect(() => {
        mountedRef.current = mounted;
        if (mounted) setDelay(0);
    }, [mounted]);

    // Whenever the selected nodes change, we need to recalculate the initial value for the modifier.
    useEffect(() => setCalculating(true), [stableNodeIds]);

    // On initial mount or when allValues change, determine the initial value for the modifier.
    useEffect(() => {
        if (!calculating) return;
        let initialValue = null;
        if (allValues && allValues.length > 0) {
            // If all values are the same, use that value. Otherwise, use null to indicate mixed values.
            const firstValue = JSON.stringify(allValues[0]);
            const allSame = allValues.every(val => JSON.stringify(val) === firstValue);
            initialValue = allSame ? allValues[0] : null;
        }
        setValue(initialValue);
        setCalculating(false);
        setMounted(true);
    }, [allValues, calculating]);

    const handleChange = useCallback((newValue: ((v: any) => any) | any) => {
        if (!mountedRef.current) return;
        let valueToApply = typeof newValue === "function" ? newValue(value) : newValue;
        setValue(valueToApply);
        nodes.forEach(node => {
            try {
                modifier.modifier.onApply(valueToApply, {
                    applier: (props) => {
                        dispatch({
                            type: "UPDATE_NODE_PROPS",
                            payload: {
                                id: node.id,
                                props
                            }
                        });
                    },
                    node
                });
            } catch (error) {
                console.error("Error applying modifier:", error);
            }
        });
    }, [nodes, value]);

    const handleInitValue = useCallback(() => {
        if(!isNullable) return;
        handleChange(modifier.modifier.defaultValue);
    }, [isNullable, modifier.modifier, handleChange]);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const contextValue = useMemo(() => ({ ref: containerRef, delay }), [delay]);

    return (
        <Context.Provider value={contextValue}>
            <Box
                component={motion.div}
                ref={containerRef}
                sx={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}>
                <Row
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10, transition: { duration: .1 } }}
                    transition={{ duration: .2, delay: index * .05 }}>
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        sx={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "space-between", gap: 1 }}>
                        <LabelWidget sx={{ flex: 1 }}>
                            {modifier.modifier.sortName || modifier.modifier.name}
                        </LabelWidget>
                        {value !== null ? (
                            <Fragment>
                                {!mounted ? (
                                    <Typography sx={{ fontSize: '10px', opacity: .5, fontStyle: 'italic', marginLeft: .5 }}>
                                        Loading...
                                    </Typography>
                                ) : (
                                    <Component
                                        nodeIds={nodeIds}
                                        value={value}
                                        onChange={handleChange}
                                    />
                                )}
                                <UnsupportedIndicator nodeIds={nodeIds} />
                            </Fragment>
                        ) : isNullable && (
                            <ActionWidget
                                icon={<DiamondPlus size={13} />}
                                color={"primary"}
                                onClick={handleInitValue}
                            />
                        )}
                        {isNullable && value !== null && (
                            <Box
                                component={motion.div}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, transition: { duration: .1 } }}>
                                <ActionWidget
                                    icon={<XIcon size={13} />}
                                    color="error"
                                    onClick={() => handleChange(null)}
                                />
                            </Box>
                        )}
                    </Box>
                </Row>
            </Box>
        </Context.Provider>
    );
}

type ContextType = {
    ref: RefObject<HTMLDivElement | null>
    delay: number
}
const Context = createContext<ContextType>({ ref: createRef(), delay: 0 });

const UnsupportedIndicator = ({ nodeIds }: { nodeIds: string[] }) => {
    const selectedNodes = useSelectedNodes();

    const supportedNodes = selectedNodes.filter(node => nodeIds.includes(node.id));
    const unsupportedNodes = selectedNodes.filter(node => !nodeIds.includes(node.id));
    const hasUnsupportedNodes = unsupportedNodes.length > 0;

    const formatNames = (nodes: typeof selectedNodes) =>
        Array.from(new Set(nodes.map(n => n.data.type)))
            .map(type => {
                const count = nodes.filter(n => n.data.type === type).length;
                return count > 1 ? `${type} (${count})` : type;
            }).join(", ");

    return (
        <AnimatePresence>
            {hasUnsupportedNodes && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ marginLeft: 3 }}>
                    <Tooltip
                        placement="top"
                        slotProps={{
                            tooltip: {
                                sx: {
                                    p: 1,
                                    maxWidth: 200
                                }
                            }
                        }}
                        title={
                            <Box sx={{ display: "flex", flexDirection: "column", gap: .5 }}>
                                <Box>
                                    <Typography sx={{ fontSize: "10px", fontWeight: 600, color: "#fbbf24" }}>
                                        Unsupported
                                    </Typography>
                                    <Typography sx={{ fontSize: "9px", lineHeight: 1.3, opacity: .8 }}>
                                        {formatNames(unsupportedNodes)}
                                    </Typography>
                                </Box>
                            </Box>
                        } arrow>
                        <AlertTriangle color="#fbbf24" size={12} />
                    </Tooltip>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

type Props = {
    children: React.ReactNode
    sx?: SxProps
}
export const ExtendedRow = memo(({ children, sx }: Props) => {
    const { ref, delay } = useContext(Context);
    if (!ref.current) return null;
    return createPortal((
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2, delay: 0 } }}
            transition={{ duration: 0.2, delay: delay }}
            sx={sx}>
            {children}
        </Box>
    ), ref.current);
})