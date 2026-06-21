import { createModifierComponent } from "../../tools";
import ColorWidget from "../../cores/styles/components/ColorWidget";

export const BackgroundColor = createModifierComponent<string>({
    id: "backgroundColor",
    name: "Background Color",
    sortName: "Bg. Color",
    category: "Appearance",
    onRetrieve: (props): string => {
        const style = props.style || {}
        const backgroundColor = style.backgroundColor;
        return String(backgroundColor || "initial");
    },
    onApply: (value, { applier, node }) => {
        applier({ style: { ...node.data.props.style, backgroundColor: value } })
    }
}, ({ value, onChange }) => {
    return (
        <ColorWidget
            value={value}
            onChange={onChange} />
    )
})