import UnitField from "../../cores/styles/components/UnitField";
import { createModifierComponent } from "../../tools";
import { getCSSGroup } from "../../css-engine";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { alpha, Box, useTheme } from "@mui/material";
import { ExtendedRow } from "../../cores/Modifier";
import { Maximize, Minimize } from "lucide-react";
import LabelWidget from "../../cores/styles/components/LabelWidget";
import ActionWidget from "../../cores/styles/components/ActionWidget";

type PaddingValue = {
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
};

const UNITS = [{ name: "num", value: "" }, "px", "em", "rem", "%", "vw", "vh"];

export const Padding = createModifierComponent({
    id: "padding",
    name: "Padding",
    category: "Appearance/Layout",
    nullable: true,
    defaultValue: {
        paddingTop: "0px",
        paddingRight: "0px",
        paddingBottom: "0px",
        paddingLeft: "0px"
    },
    onRetrieve(props) {
        const value = getCSSGroup(props.style || {}, "padding") as PaddingValue;
        if (Object.keys(value).length === 0) return null;
        return value;
    },
    onApply: (value, { applier, node }) => {
        const style = { ...(node.data.props.style || {}), ...value };
        if (value === null) {
            delete style.padding;
            delete style.paddingTop;
            delete style.paddingRight;
            delete style.paddingBottom;
            delete style.paddingLeft;
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

    useEffect(() => {
        if (!value || ignoreCollapseRef.current) {
            ignoreCollapseRef.current = false;
            return;
        }
        const vals = [value.paddingTop, value.paddingRight, value.paddingBottom, value.paddingLeft];
        const isUniform = vals.every(v => v === vals[0]);

        if (!isUniform) {
            setIsCollapsed(false);
        } else {
            setIsCollapsed(true);
        }
    }, [value]);
    const handleUpdate = useCallback((side: keyof PaddingValue, newValue: string) => {
        if (isCollapsed) {
            onChange({
                paddingTop: newValue,
                paddingRight: newValue,
                paddingBottom: newValue,
                paddingLeft: newValue
            });
        } else {
            onChange({ ...value, [side]: newValue });
        }
    }, [isCollapsed, value, onChange]);

    const toggleCollapse = useCallback(() => {
        ignoreCollapseRef.current = true; 
        setIsCollapsed((prev) => {
            const nextState = !prev;
            if (nextState) {
                const unifiedValue = value?.paddingTop || "0px";
                onChange({
                    paddingTop: unifiedValue,
                    paddingRight: unifiedValue,
                    paddingBottom: unifiedValue,
                    paddingLeft: unifiedValue
                });
            }
            return nextState;
        });
    }, [value?.paddingTop, onChange]);

    return (
        <Fragment>
            {isCollapsed && (
                <UnitField
                    value={value?.paddingTop || ""}
                    units={UNITS}
                    onChange={(newValue) => handleUpdate('paddingTop', newValue)}
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
                                        value={value?.paddingTop || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('paddingTop', val)}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <LabelWidget>Bottom</LabelWidget>
                                <Box sx={{ ml: 2 }}>
                                    <UnitField
                                        value={value?.paddingBottom || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('paddingBottom', val)}
                                    />
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <LabelWidget>Left</LabelWidget>
                                <Box sx={{ ml: 2 }}>
                                    <UnitField
                                        value={value?.paddingLeft || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('paddingLeft', val)}
                                    />
                                </Box>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <LabelWidget>Right</LabelWidget>
                                <Box sx={{ ml: 2 }}>
                                    <UnitField
                                        value={value?.paddingRight || ""}
                                        units={UNITS}
                                        onChange={(val) => handleUpdate('paddingRight', val)}
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