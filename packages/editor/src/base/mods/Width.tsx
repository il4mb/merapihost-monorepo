import { createModifierComponent } from "../../tools";
import { Fragment, useRef } from "react";
import UnitField from "../../cores/styles/components/UnitField";
import ActionWidget from "../../cores/styles/components/ActionWidget";
import { Ruler, Sparkles } from "lucide-react";
import LabelWidget from "../../cores/styles/components/LabelWidget";
import { Box, Tooltip } from "@mui/material";

export const WidthModifier = createModifierComponent<string>({
    id: "Width",
    name: "Width",
    category: "Appearance/Layout",
    nullable: true,
    defaultValue: "auto",
    onRetrieve(props) {
        if (!props.style || !props.style.width) return null;
        return String(props.style.width);
    },
    onApply: (value, { applier, node }) => {
        applier({ style: { ...node.data.props.style, width: value || undefined } })
    }
}, ({ value, onChange }) => {
    const isAuto = value === "auto";
    const lastValueRef = useRef<string>(null);

    const toggleWidth = () => {
        if (isAuto) {
            onChange(lastValueRef.current || "100%");
        } else {
            if (value !== "auto") lastValueRef.current = value;
            onChange("auto");
        }
    }

    return (
        <Fragment>
            {!isAuto ? (
                <UnitField
                    value={String(value)}
                    onChange={onChange} />
            ) : (
                <LabelWidget>Auto</LabelWidget>
            )}
            <Tooltip
                slotProps={{
                    tooltip: { sx: { fontSize: "12px" } }
                }}
                title={isAuto ? "Set to specific width" : "Set to auto width"}
                placement="top"
                arrow>
                <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
                    <ActionWidget
                        onClick={toggleWidth}
                        color={isAuto ? "primary" : "default"}
                        icon={<Sparkles size={12} />} />
                </Box>
            </Tooltip>
        </Fragment>
    );
});