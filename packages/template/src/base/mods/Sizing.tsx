import { createModifierComponent } from "../../tools";
import { Fragment } from "react";
import { ExtendedRow } from "../../cores/Modifier";
import UnitField from "../../cores/styles/components/UnitField";
import { Box } from "@mui/material";
import LabelWidget from "../../cores/styles/components/LabelWidget";

type SizingValue = {
    width: string | number;
    height: string | number;
}

export const Sizing = createModifierComponent<SizingValue>({
    id: "sizing",
    name: "Sizing",
    category: "Appearance/Layout",
    nullable: true,
    defaultValue: {
        width: "auto",
        height: "auto"
    },
    onRetrieve(props) {
        if (!props.style) return null;
        if (!props.style.width && !props.style.height) return null;
        return {
            width: props.style.width || "auto",
            height: props.style.height || "auto"
        }
    },
    onApply: (value, { applier, node }) => {
        const newStyle = {
            ...node.data.props.style,
            width: value?.width || undefined,
            height: value?.height || undefined
        }
        applier({ style: newStyle })
    }
}, ({ value, onChange }) => {

    const isWidthNumber = typeof value?.width === "number";
    const isHeightNumber = typeof value?.height === "number";

    return (
        <Fragment>
            <ExtendedRow>

                <Box sx={{ mt: 1, display: "flex", flexDirection: "row", justifyContent: "space-evenly", gap: 1 }}>
                    <LabelWidget>Width</LabelWidget>
                    <UnitField
                        value={String(value?.width)}
                        onChange={(newWidth) => onChange({ ...value, width: newWidth })}
                    />
                </Box>
                <Box sx={{ mt: 1, display: "flex", flexDirection: "row", justifyContent: "space-evenly", gap: 1 }}>
                    <LabelWidget>Height</LabelWidget>
                    <UnitField
                        value={String(value?.height || "auto")}
                        onChange={(newHeight) => onChange({ ...value, height: newHeight })}
                    />
                </Box>
            </ExtendedRow>
        </Fragment>
    );
});