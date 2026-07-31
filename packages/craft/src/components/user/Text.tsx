import { Typography } from "@mui/material";
import { useNode } from "@craftjs/core";

interface TextProps {
    text: string;
}

export const Text = ({ text }: TextProps) => {
    const { connectors: { connect, drag }, isClicked, actions: { setProp } } = useNode((state) => ({
        isClicked: state.events.selected,
    }));

    return (
        <Typography ref={(ref) => connect(drag(ref))} variant="body1">
            {text}
        </Typography>
    );
}

Text.craft = {
    displayName: "Text",
    props: {
        text: "Hello World"
    },
    related: {
        settings: null
    },
    rules: {
        canDrag: () => true,
        canMoveIn: (incomingNode) => {
            return incomingNode.data.type !== Text;
        }
    }
};