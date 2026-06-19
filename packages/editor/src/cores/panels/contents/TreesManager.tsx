import { Box, Divider, IconButton, styled, Typography } from "@mui/material"
import { useEditor } from "../../EditorProvider"
import { useCallback, useMemo, useRef, useState } from "react"
import { NodeObject } from "../../../type"
import { ChevronRight, Component } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useTypeRegistry } from "../../TypeRegistry"
import LabelField from "../../tools/LabelField"

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

const TreeContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: "100%"
})

const ItemContainer = styled("div")({
    display: "flex",
    alignItems: "center",
    padding: "4px 8px",
    cursor: "pointer",
    borderRadius: "6px",
    userSelect: "none",
    transition: "background-color 0.15s ease",
    "&:hover": {
        backgroundColor: "rgba(0, 0, 0, 0.05)"
    }
})

const ToggleButton = styled(IconButton)({
    padding: "2px",
    marginRight: "4px",
    width: "18px",
    height: "18px",
    "&:hover": {
        backgroundColor: "rgba(0,0,0,0.08)"
    }
})

const ToggleIcon = styled(motion.div)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
})

type TreeProps = {
    node: NodeObject
    defaultOpen?: boolean
    depth?: number
}

const Tree = ({ node, defaultOpen = true, depth = 0 }: TreeProps) => {

    const ignoreInteractionRef = useRef(false);
    const { registries } = useTypeRegistry();
    const { state, dispatch } = useEditor();

    const [collapsed, setCollapsed] = useState(!defaultOpen);
    const isSelected = state.selected.has(node.id);
    const isHovered = state.hovered.has(node.id);

    const type = node.type ? registries[node.type] : undefined;
    const name = typeof node.name === "string" ? node.name : node.type || node.tagName || "Unknown";

    const childNodes = useMemo(() => {
        return Array.from(state.nodes.values()).filter(n => {
            const type = n.type ? registries[n.type] : undefined;
            if (type?.model?.visibleOnTree === false) {
                return false;
            }
            return n.parent === node.id;
        }).sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [state.nodes, node.id]);
    const hasChildren = childNodes.length > 0;

    const onToggle = useCallback((e: React.MouseEvent) => {
        if (ignoreInteractionRef.current) return;
        e.stopPropagation();
        setCollapsed(prev => !prev);
    }, []);

    const onMouseEnter = useCallback(() => {
        if (ignoreInteractionRef.current) return;
        dispatch({ type: "ADD_HOVERED", payload: node.id });
    }, []);

    const onMouseLeave = useCallback(() => {
        if (ignoreInteractionRef.current) return;
        dispatch({ type: "CLEAR_HOVERED" });
    }, []);

    const onClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (ignoreInteractionRef.current) return;
        e.stopPropagation()
        if (state.selected.has(node.id)) {
            dispatch({ type: "REMOVE_SELECTED", payload: node.id })
        } else {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                dispatch({ type: "ADD_SELECTED", payload: node.id })
            } else {
                dispatch({ type: "SET_SELECTED", payload: node.id })
            }
            const dom = state.doms.get(node.id);
            const win = dom?.ownerDocument?.defaultView;

            if (dom && win) {
                win.requestAnimationFrame(() => {
                    // 1. Get the node's position relative to the iframe's current viewport
                    const rect = dom.getBoundingClientRect();

                    // 2. Calculate the exact center of the iframe's viewport
                    const targetY = win.scrollY + rect.top - (win.innerHeight / 2) + (rect.height / 2);
                    const targetX = win.scrollX + rect.left - (win.innerWidth / 2) + (rect.width / 2);

                    // 3. Scroll ONLY the iframe's window
                    win.scrollTo({
                        top: targetY,
                        left: targetX,
                        behavior: "smooth"
                    });
                })
            }
        }
    }, [node, state.selected, state.doms, dispatch, node.id]);

    const setName = useCallback((newName: string) => {
        dispatch({ type: "UPDATE_NODE", payload: { id: node.id, name: newName } });
    }, [node.id, dispatch]);

    const onFinishNameChange = useCallback((finalName: string) => {
        dispatch({ type: "UPDATE_NODE", payload: { id: node.id, name: finalName || node.type || node.tagName || "Unknown" } });
        ignoreInteractionRef.current = false;
    }, [node.id, dispatch]);

    const onStartNameEditing = useCallback(() => {
        ignoreInteractionRef.current = true;
    }, []);

    if (type?.model?.visibleOnTree === false) {
        return null;
    }

    const IconComponent = type?.model?.icon || Component;

    return (
        <TreeContainer>
            <ItemContainer
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
                sx={theme => ({
                    paddingLeft: `${depth * 16 + 8}px`,
                    backgroundColor: isSelected
                        ? "rgba(0, 120, 215, 0.1)"
                        : isHovered
                            ? "rgba(0, 0, 0, 0.05)"
                            : "transparent",
                    "&:hover": {
                        backgroundColor: isSelected
                            ? "rgba(0, 120, 215, 0.15)"
                            : "rgba(0, 0, 0, 0.1)"
                    },
                    ...theme.applyStyles("dark", {
                        backgroundColor: isSelected
                            ? "rgba(0, 128, 255, 0.4)"
                            : isHovered
                                ? "rgba(255, 255, 255, 0.1)"
                                : "transparent",
                        "&:hover": {
                            backgroundColor: isSelected
                                ? "rgba(0, 128, 255, 0.5)"
                                : "rgba(255, 255, 255, 0.15)"
                        }
                    })
                })}>
                {hasChildren ? (
                    <ToggleButton size="small" onClick={onToggle}>
                        <ToggleIcon
                            initial={false}
                            animate={{ rotate: collapsed ? 0 : 90 }}
                            transition={{ duration: 0.2 }}>
                            <ChevronRight size={12} />
                        </ToggleIcon>
                    </ToggleButton>
                ) : (
                    <Box sx={{ width: "24px" }} />
                )}
                <Box sx={{ mr: .5 }}>
                    <IconComponent size={13} />
                </Box>
                {/* <Typography
                    variant="body2"
                    sx={{ fontWeight: hasChildren ? 500 : 400, fontSize: "12px" }}>
                    {name}
                </Typography> */}
                <LabelField
                    value={name}
                    onChange={setName}
                    onFinish={onFinishNameChange}
                    onStartEditing={onStartNameEditing} />
            </ItemContainer>
            <AnimatePresence initial={false}>
                {!collapsed && hasChildren && (
                    <Box
                        component={motion.div}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        sx={{ overflow: "hidden" }}>
                        {childNodes.map(child => (
                            <Tree key={child.id} node={child} depth={depth + 1} />
                        ))}
                    </Box>
                )}
            </AnimatePresence>
        </TreeContainer>
    );
};

interface TreeManagerProps { }

export default function TreeManager({ }: TreeManagerProps) {
    const { state } = useEditor();
    const rootNode = useMemo(() => {
        return state.nodes.get("root") || null;
    }, [state.nodes]);

    return (
        <Box>
            <Typography
                variant="overline"
                sx={{ px: 1, display: "block", fontWeight: 600 }}>
                Layers
            </Typography>
            <Divider sx={{ mb: 1 }} />

            <ScrollContainer>
                {rootNode && <Tree key={rootNode.id} node={rootNode} />}
            </ScrollContainer>
        </Box>
    )
}
