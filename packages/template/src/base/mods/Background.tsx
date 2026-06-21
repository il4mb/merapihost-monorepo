import { createModifierComponent } from "../../tools";
import ColorWidget from "../../cores/styles/components/ColorWidget";

export const Background = createModifierComponent<string>({
    id: "background",
    name: "Background",
    sortName: "Bg.",
    category: "Appearance",
    onRetrieve(props) {
        const style = props.style || {}
        const background = style.background;
        return String(background || "initial");
    },
    onApply: (value, { applier, node }) => {
        const style = { ...node.data.props.style, background: value }
        applier({ style })
    }
}, ({ value, onChange }) => {
    return (
        <ColorWidget
            value={value}
            onChange={onChange} />
    );
});