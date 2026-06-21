import { createModifierComponent } from "../../tools";
import ColorWidget from "../../cores/styles/components/ColorWidget";

export const Color = createModifierComponent(
    {
        id: "color",
        name: "Color",
        category: "Appearance/Text",
        nullable: true,
        defaultValue: "#1a73e7",
        onRetrieve: (props) => {
            if (!props.style || !props.style.color) return null;
            return props.style.color;
        },
        onApply: (value, { applier, node }) => {
            applier({
                style: {
                    ...node.data.props.style,
                    color: value || undefined
                }
            })
        }
    },
    ({ value, onChange }) => {

        return (
            <ColorWidget
                value={value}
                onChange={onChange} />
        )
    }
)