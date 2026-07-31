import UnitField from "../../cores/styles/components/UnitField";
import { createModifierComponent } from "../../tools";
import { getCSSGroup } from "../../css-engine";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { alpha, Box, useTheme } from "@mui/material";
import { ExtendedRow } from "../../cores/Modifier";
import { Maximize, Minimize } from "lucide-react";
import LabelWidget from "../../cores/styles/components/LabelWidget";
import ActionWidget from "../../cores/styles/components/ActionWidget";

type MarginValue = {
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
};

const UNITS = [{ name: "num", value: "" }, "px", "em", "rem", "%", "vw", "vh"];

export const Margin = createModifierComponent({
    id: "margin",
    name: "Margin",
    category: "Appearance/Layout",
    nullable: true,
    defaultValue: {
        marginTop: "0px",
        marginRight: "0px",
        marginBottom: "0px",
        marginLeft: "0px"
    },
    onRetrieve(props) {
        const value = getCSSGroup(props.style || {}, "margin") as MarginValue;
        if (Object.keys(value).length === 0) return null; // Return null if no margin styles are set
        return value;
    },
    onApply: (value, { applier, node }) => {
        const { margin, ...style } = { ...(node.data.props.style || {}), ...value };
        if (margin === null) {
            delete style.margin;
            delete style.marginTop;
            delete style.marginRight;
            delete style.marginBottom;
            delete style.marginLeft;
        }
        applier({ style });
    }
}, ({ value, onChange }) => {
    const theme = useTheme();

    const ignoreCollapseRef = useRef(false);
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (!value) return true;
        const values = Object.values(value);
        return values.every(val => val === values[0]);
    });

    // Auto-expand if the margin is changed externally and becomes non-uniform
    useEffect(() => {
        if (!value || ignoreCollapseRef.current) {
            ignoreCollapseRef.current = false; // Reset the flag after ignoring one change
            return;
        }
        const vals = [value.marginTop, value.marginRight, value.marginBottom, value.marginLeft];
        const isUniform = vals.every(v => v === vals[0]);

        if (!isUniform) {
            setIsCollapsed(false);
        } else {
            setIsCollapsed(true);
        }
    }, [value]);

    // Unified update handler for both collapsed and expanded states
    const handleUpdate = useCallback((side: keyof MarginValue, newValue: string) => {
        if (isCollapsed) {
            // If collapsed, changing the 1 input updates ALL 4 sides simultaneously
            onChange({
                marginTop: newValue,
                marginRight: newValue,
                marginBottom: newValue,
                marginLeft: newValue
            });
        } else {
            // If expanded, strictly update the side that was changed
            onChange({ ...value, [side]: newValue });
        }
    }, [isCollapsed, value, onChange]);

    const toggleCollapse = useCallback(() => {
        ignoreCollapseRef.current = true; // Set flag to ignore the upcoming change triggered by toggling
        setIsCollapsed((prev) => {
            const nextState = !prev;
            if (nextState) {
                // When collapsing, immediately unify all sides to match the Top value
                const unifiedValue = value?.marginTop || "0px";
                onChange({
                    marginTop: unifiedValue,
                    marginRight: unifiedValue,
                    marginBottom: unifiedValue,
                    marginLeft: unifiedValue
                });
            }
            return nextState;
        });
    }, [value?.marginTop, onChange]);

    return (
        <Fragment>
            {isCollapsed && (
                <UnitField
                    value={value?.marginTop || ""}
                    units={UNITS}
                    // Updating this single field triggers handleUpdate which syncs all 4 sides
                    onChange={(newValue) => handleUpdate('marginTop', newValue)}
                />
            )}

            <ActionWidget
                color={isCollapsed ? "default" : "primary"}
                icon={isCollapsed ? <Minimize size={14} /> : <Maximize size={14} />}
                onClick={toggleCollapse}
            />

            {!isCollapsed && (
                <ExtendedRow
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        justifyContent: "flex-end",
                        px: 2, py: 1, pb: 2.5, mt: 0.4,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        outline: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderRadius: 1
                    }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <LabelWidget>Top</LabelWidget>
                                <Box sx={{ ml: 2 }}>
                                    <UnitField
                                        value={value?.marginTop || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('marginTop', val)}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <LabelWidget>Bottom</LabelWidget>
                                <Box sx={{ ml: 2 }}>
                                    <UnitField
                                        value={value?.marginBottom || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('marginBottom', val)}
                                    />
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <LabelWidget>Left</LabelWidget>
                                <Box sx={{ ml: 2 }}>
                                    <UnitField
                                        value={value?.marginLeft || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('marginLeft', val)}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <LabelWidget>Right</LabelWidget>
                                <Box sx={{ ml: 2 }}>
                                    <UnitField
                                        value={value?.marginRight || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('marginRight', val)}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </ExtendedRow>
            )}
        </Fragment>
    );
});