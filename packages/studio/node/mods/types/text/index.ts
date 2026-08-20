import { Model } from "@nodes/engine/Model";
import TextComponent from "./TextComponent";
import { commands } from "./commands";

export type TextNodeData = {
    text: string;
};

declare module "@nodes/registry" {
    interface TypeRegistry {
        text: {
            commands: {
                test: (text: string) => void;
            },
            data: TextNodeData;
        }
    }
}



export default new Model({
    name: "text",
    label: "Text",
    extends: "element",
    default: {
        tagName: "p",
        data: {
            text: "Hello, World!"
        }
    },
    commands: commands,
    component: TextComponent,
    onCreate: function (node) {
        console.log("Text node created:", node.type);
        this.useEffect(() => {
            console.log("Text node data changed:", node.data.text);
        }, [node.data.text]);
    },
    onMount: function (node) {
        console.log("Text node mounted:", node.type);
    },
    onUnmount: function (node) {
        console.log("Text node unmounted:", node.type);
    },
});