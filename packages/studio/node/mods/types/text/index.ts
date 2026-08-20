import { Model } from "@nodes/engine/Model";
import TextComponent from "./TextComponent";

export default new Model({
    name: "text",
    label: "Text",
    extends: "element",
    default: {
        tagName: "p",
        props: {
            text: "Hello, World!",
            id: "text-" + Math.random().toString(36).substr(2, 9),
        }
    },
    commands: {
        testing: (node) => {
            node.props.id
            return true;
        }
    },
    component: TextComponent,
    onCreate: (node) => {
        node.wire(() => {
            console.log("Text node props changed:", node.props);
        }, [node.props.text]);
    },
    onUnmount: (node) => {

    },



});

// export default textModel;