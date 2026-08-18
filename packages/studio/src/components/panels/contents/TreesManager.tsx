import { Box, Divider, IconButton, styled, Typography } from "@mui/material";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { ChevronRight, CircleQuestionMark, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNodes } from "@/contexts";
import { useNodeChildren } from "@/hooks/useNodes";
import LabelField from "@/components/ui/fields/LabelField";
import ScrollContainer from "@/components/ui/ScrollContainer";
import { NodeModel } from "@/libs/node/NodeModel";
import { useIsDark } from "@/theme";

const TreeContainer = styled("div")({
    display: "flex",
    flexDirection: "column",
    width: "100%",
});

const ItemContainer = styled("div")({
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 0.15s ease",
    "&:hover": {
        backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
});

const ToggleButton = styled(IconButton)({
    padding: "2px",
    marginRight: "4px",
    width: "16px",
    height: "16px",
    minWidth: "0px",
    minHeight: "0px",
    border: "none",
});

const ToggleIcon = styled(motion.div)({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

type TreeProps = {
    node: NodeModel;
    defaultOpen?: boolean;
    depth?: number;
    color?: string;
    isNodeVisible?: boolean;
};

type TreeVisualProps = TreeProps & {
    isSelected: boolean;
    isHovered: boolean;
    childNodes: NodeModel[];
    dispatch: any; // Use the exact Dispatch type from your useNodesReducer if available
};

// 1. Pure Visual Component wrapped in React.memo
const TreeVisual = memo(
    ({
        node,
        defaultOpen = true,
        depth = 0,
        color: extendedColor,
        isNodeVisible,
        isSelected,
        isHovered,
        childNodes,
        dispatch,
    }: TreeVisualProps) => {
        const isDark = useIsDark();
        const ignoreInteractionRef = useRef(false);

        const color = useMemo(() => {
            return extendedColor || node.type?.getColor(isDark) || undefined;
        }, [isDark, extendedColor, node.type]);

        const childrenColor = useMemo(() => {
            return extendedColor || node.type?.getChildrenColor(isDark) || undefined;
        }, [isDark, extendedColor, node.type]);

        const parentVisible = isNodeVisible ?? true;
        const isVisible = parentVisible && (node.visible ?? true);

        const hasChildren = childNodes.length > 0;
        const childrenHasSpanned = childNodes.some((child) => child.type.name === "spanned");

        const [collapsed, setCollapsed] = useState(!defaultOpen || childrenHasSpanned);

        const onToggle = useCallback((e: React.MouseEvent) => {
            if (ignoreInteractionRef.current) return;
            e.stopPropagation();
            setCollapsed((prev) => !prev);
        }, []);

        const onMouseEnter = useCallback(() => {
            if (ignoreInteractionRef.current) return;
            dispatch({ type: "ADD_HOVERED", payload: node.id });
        }, [dispatch, node.id]);

        const onMouseLeave = useCallback(() => {
            if (ignoreInteractionRef.current) return;
            dispatch({ type: "CLEAR_HOVERED" });
        }, [dispatch]);

        const onClick = useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                if (ignoreInteractionRef.current) return;
                e.stopPropagation();

                if (isSelected) {
                    dispatch({ type: "REMOVE_SELECTED", payload: node.id });
                } else {
                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        dispatch({ type: "ADD_SELECTED", payload: node.id });
                    } else {
                        dispatch({ type: "SET_SELECTED", payload: node.id });
                    }

                    const dom = node.dom;
                    const win = dom?.ownerDocument?.defaultView;

                    if (dom && win) {
                        win.requestAnimationFrame(() => {
                            const rect = dom.getBoundingClientRect();
                            const targetY = win.scrollY + rect.top - win.innerHeight / 2 + rect.height / 2;
                            const targetX = win.scrollX + rect.left - win.innerWidth / 2 + rect.width / 2;

                            win.scrollTo({ top: targetY, left: targetX, behavior: "smooth" });
                        });
                    }
                }
            },
            [isSelected, dispatch, node.id, node.dom],
        );

        const setName = useCallback(
            (newName: string) => {
                dispatch({ type: "UPDATE_NODE", payload: { id: node.id, name: newName } });
            },
            [dispatch, node.id],
        );

        const onFinishNameChange = useCallback(
            (finalName: string) => {
                const processedName = finalName || node.type.getDefaultName(node);
                dispatch({ type: "UPDATE_NODE", payload: { id: node.id, name: processedName } });
                ignoreInteractionRef.current = false;
            },
            [dispatch, node.id, node.type],
        );

        const onStartNameEditing = useCallback(() => {
            ignoreInteractionRef.current = true;
            dispatch({
                type: "BULK",
                payload: [
                    { type: "CLEAR_SELECTED" },
                    { type: "CLEAR_HOVERED" },
                    { type: "SET_SELECTED", payload: node.id },
                ],
            });
        }, [dispatch, node.id]);

        const toggleVisibility = useCallback(
            (e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                dispatch({ type: "UPDATE_NODE", payload: { id: node.id, visible: !isVisible } });
            },
            [dispatch, node.id, isVisible],
        );

        if (node.type?.visibleOnTree === false) {
            return null;
        }

        const IconComponent = node.type?.icon || CircleQuestionMark;

        return (
            <TreeContainer>
                <ItemContainer
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    onClick={onClick}
                    sx={(theme) => ({
                        opacity: isVisible ? 1 : 0.5,
                        paddingLeft: `${depth * 12}px`,
                        backgroundColor: isSelected
                            ? "rgba(0, 120, 215, 0.25)"
                            : isHovered
                              ? "rgba(0, 0, 0, 0.05)"
                              : "transparent",
                        "&:hover": {
                            backgroundColor: isSelected ? "rgba(0, 120, 215, 0.25)" : "rgba(0, 0, 0, 0.1)",
                            "& .visibility-toggle": { opacity: 1 },
                        },
                        ...theme.applyStyles("dark", {
                            backgroundColor: isSelected
                                ? "rgba(0, 128, 255, 0.35)"
                                : isHovered
                                  ? "rgba(100, 100, 100, 0.1)"
                                  : "transparent",
                            "&:hover": {
                                backgroundColor: isSelected ? "rgba(0, 128, 255, 0.5)" : "rgba(100, 100, 100, 0.15)",
                            },
                        }),
                        "& .visibility-toggle": { opacity: 0 },
                    })}
                >
                    {hasChildren ? (
                        <ToggleButton size="small" onClick={onToggle}>
                            <ToggleIcon
                                initial={false}
                                animate={{ rotate: collapsed ? 0 : 90 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronRight size={12} />
                            </ToggleIcon>
                        </ToggleButton>
                    ) : (
                        <Box sx={{ width: "24px" }} />
                    )}
                    <Box sx={{ mr: 0.5 }}>
                        <IconComponent color={color} size={14} />
                    </Box>
                    <LabelField
                        sx={{ color: color || "inherit" }}
                        value={node.name}
                        onChange={setName}
                        onFinish={onFinishNameChange}
                        onStartEditing={onStartNameEditing}
                    />

                    <ToggleButton
                        onClick={toggleVisibility}
                        className="visibility-toggle"
                        size="small"
                        sx={{ ml: "auto", mr: 1 }}
                    >
                        {isVisible ? <Eye size={12} /> : <EyeOff size={12} style={{ opacity: 0.85 }} />}
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
                            sx={{ overflow: "hidden" }}
                        >
                            {childNodes.map((child) => (
                                // IMPORTANT: Call the Wrapper component, NOT the visual component directly
                                <Tree
                                    key={child.id}
                                    node={child}
                                    depth={depth + 1}
                                    defaultOpen={!childrenHasSpanned}
                                    color={childrenColor}
                                    isNodeVisible={isVisible}
                                />
                            ))}
                        </Box>
                    )}
                </AnimatePresence>
            </TreeContainer>
        );
    },
    (prevProps, nextProps) => {
        // Custom equality check: only re-render if THESE specific things change.
        // This stops hover/select events on sibling nodes from causing re-renders here.
        return (
            prevProps.node === nextProps.node &&
            prevProps.isSelected === nextProps.isSelected &&
            prevProps.isHovered === nextProps.isHovered &&
            prevProps.isNodeVisible === nextProps.isNodeVisible &&
            prevProps.color === nextProps.color &&
            prevProps.defaultOpen === nextProps.defaultOpen &&
            prevProps.depth === nextProps.depth &&
            // Shallow compare array references to prevent false renders from hook recreations
            prevProps.childNodes.length === nextProps.childNodes.length &&
            prevProps.childNodes.every((child, idx) => child === nextProps.childNodes[idx])
        );
    },
);

// 2. The Context Wrapper
// This lightweight component subscribes to the context but passes isolated values down.
const Tree = (props: TreeProps) => {
    const { state, dispatch } = useNodes();
    const { node } = props;

    // Isolate the exact boolean states this specific node cares about
    const isSelected = state.selected.has(node.id);
    const isHovered = state.hovered.has(node.id);
    const childNodes = useNodeChildren(node);

    return (
        <TreeVisual
            {...props}
            isSelected={isSelected}
            isHovered={isHovered}
            childNodes={childNodes}
            dispatch={dispatch}
        />
    );
};

interface TreeManagerProps {}

export default function TreeManager({}: TreeManagerProps) {
    const { state } = useNodes();

    const rootNode = useMemo(() => {
        return state.collection.get("root") || null;
    }, [state.collection]);

    return (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
                Layers
            </Typography>
            <Divider sx={{ mb: 1 }} />

            <ScrollContainer>{rootNode && <Tree key={rootNode.id} node={rootNode} />}</ScrollContainer>
        </Box>
    );
}
