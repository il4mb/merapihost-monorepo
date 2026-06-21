import { Box, Divider, IconButton, styled, Typography } from "@mui/material"
import { useEditor } from "../../EditorProvider"
import { useCallback, useMemo, useRef, useState } from "react"
import { NodeObject } from "../../../types/node"
import { ChevronRight, CircleQuestionMark, Component, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { useTypeRegistry } from "../../TypeRegistry"
import LabelField from "../../components/LabelField"
import { useTypeContext } from "../../../hooks/useNodes"

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
});

const TreeContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: "100%"
});

const ItemContainer = styled("div")({
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 0.15s ease",
    "&:hover": {
        backgroundColor: "rgba(0, 0, 0, 0.05)"
    }
});

const ToggleButton = styled(IconButton)({
    padding: "2px",
    marginRight: "4px",
    width: "16px",
    height: "16px",
    minWidth: "0px",
    minHeight: "0px",
    border: "none",
    "&:hover": {
        // backgroundColor: "rgba(0,0,0,0.08)"
    }
});

const ToggleIcon = styled(motion.div)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});

type TreeProps = {
    node: NodeObject
    defaultOpen?: boolean
    depth?: number
    color?: string
    isNodeVisible?: boolean
};

const Tree = ({ node, defaultOpen = true, depth = 0, color: extendedColor, isNodeVisible }: TreeProps) => {

    const ignoreInteractionRef = useRef(false);
    const { registries } = useTypeRegistry();
    const { state, dispatch } = useEditor();

    const [collapsed, setCollapsed] = useState(!defaultOpen);
    const isSelected = state.selected.has(node.id);
    const isHovered = state.hovered.has(node.id);
    const typeContext = useTypeContext(node.id);

    const getDefaultName = useCallback(() => {
        if (!typeContext.type?.model.default?.name) return node.name || node.type || node.tagName || "Unknown";
        if (typeof typeContext.type.model.default.name === "string") {
            return typeContext.type.model.default.name;
        }
        return typeContext.type.model.default.name.call(typeContext);
    }, [typeContext]);

    const type = node.type ? registries[node.type] : undefined;
    const name = (typeof node.name === "string" ? node.name : "") || getDefaultName();
    const color = extendedColor || type?.model?.color;
    const childrenColor = extendedColor || type?.model?.childrenColor;
    const parentVisible = isNodeVisible ?? true;
    const isVisible = parentVisible && (node.visible ?? true);

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
        const processedName = finalName || getDefaultName();
        dispatch({ type: "UPDATE_NODE", payload: { id: node.id, name: processedName } });
        ignoreInteractionRef.current = false;
    }, [node.id, dispatch, getDefaultName]);

    const onStartNameEditing = useCallback(() => {
        ignoreInteractionRef.current = true;
        dispatch({
            type: "BULK",
            payload: [
                { type: "CLEAR_SELECTED" },
                { type: "CLEAR_HOVERED" },
                { type: "SET_SELECTED", payload: node.id }
            ]
        })
    }, []);

    const toggleVisibility = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        dispatch({ type: "UPDATE_NODE", payload: { id: node.id, visible: !isVisible } });
    }, [node.id, dispatch, isVisible]);

    if (type?.model?.visibleOnTree === false) {
        return null;
    }

    const IconComponent = type?.model?.icon || CircleQuestionMark;

    return (
        <TreeContainer>
            <ItemContainer
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
                sx={theme => ({
                    opacity: isVisible ? 1 : 0.5,
                    paddingLeft: `${depth * 16 + 8}px`,
                    backgroundColor: isSelected
                        ? "rgba(0, 120, 215, 0.1)"
                        : isHovered
                            ? "rgba(0, 0, 0, 0.05)"
                            : "transparent",
                    "&:hover": {
                        backgroundColor: isSelected
                            ? "rgba(0, 120, 215, 0.15)"
                            : "rgba(0, 0, 0, 0.1)",
                        "& .visibility-toggle": {
                            opacity: 1
                        }
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
                    }),
                    "& .visibility-toggle": {
                        opacity: 0
                    }
                })}>
                {hasChildren ? (
                    <ToggleButton
                        size="small"
                        onClick={onToggle}>
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
                    <IconComponent
                        color={color}
                        size={14} />
                </Box>
                <LabelField
                    sx={{ color: color || "inherit" }}
                    value={name}
                    onChange={setName}
                    onFinish={onFinishNameChange}
                    onStartEditing={onStartNameEditing} />

                <ToggleButton onClick={toggleVisibility} className="visibility-toggle" size="small" sx={{ ml: "auto", mr: 1 }}>
                    {isVisible ? (<Eye size={12} />) : (<EyeOff size={12} style={{ opacity: 0.85 }} />)}
                </ToggleButton>

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
                            <Tree
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                color={childrenColor}
                                isNodeVisible={isVisible}
                            />
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
