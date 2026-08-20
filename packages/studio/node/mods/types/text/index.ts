import { Model } from "@nodes/engine/Model";
import TextComponent from "./TextComponent";
import { commands } from "./commands";

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
    commands: commands,
    component: TextComponent,
    onCreate: (node) => {
        console.log("Text node created:", node.type);
    },
    onUnmount: (node) => {

    },
});