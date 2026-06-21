import { createModifierComponent } from "../../tools";
import UnitField from "../../cores/styles/components/UnitField";

const UNITS = ["px", "em", "rem", "%", "vw", "vh"];

export const BorderRadius = createModifierComponent(
    {
        id: "borderRadius",
        name: "Border Radius",
        sortName: "B. radius",
        category: "Appearance/Layout",
        nullable: true,
        defaultValue: "5px",

        onRetrieve: (props) => {
            if (!props.style || !props.style.borderRadius) return null;
            return props.style.borderRadius;
        },
        onApply: (value, { applier, node }) => {
            const style = { ...node.data.props.style, borderRadius: value };
            if (!value) {
                style.borderRadius = undefined;
            }
            applier({ style })
        }
    },
    ({ value, onChange }) => {

        return (
            <UnitField
                value={String(value)}
                units={UNITS}
                onChange={onChange} />
        )
    },)