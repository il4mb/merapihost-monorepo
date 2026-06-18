import UnitField from "../../cores/styles/components/UnitField";
import { createModifierComponent } from "../../tools";

const UNITS = [{ name: "num", value: "" }, "px", "em", "rem", "%", "vw", "vh"];
export const FontSize = createModifierComponent<string | number>({
    id: "fontSize",
    name: "Font Size",
    sortName: "F. size",
    category: "Appearance/Text",
    nullable: true,
    defaultValue: "12px",
    onRetrieve: (props) => {
        if (!props.style || !props.style.fontSize) return null;
        return props.style.fontSize;
    },
    onApply: (value, { applier, node }) => {
        const style = { ...node.data.props.style, fontSize: value || undefined };
        if (!value) {
            style.fontSize = undefined;
        }
        applier({ style })
    }
}, ({ value, onChange }) => {
    return (
        <UnitField
            value={String(value)}
            units={UNITS}
            onChange={onChange} />
    );
});