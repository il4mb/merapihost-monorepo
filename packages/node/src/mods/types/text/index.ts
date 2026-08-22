import type { Node } from "@/engine";
import { commands } from "./commands";
import { createModel } from "@/mods";
import TextComponent from "./TextComponent";

export type TextNodeData = {
    text: string;
    editing: boolean;
};
export type TextSelection = {
    anchor: number;
    focus: number;
}

declare global {
    interface ModelRegistry {
        text: {
            commands: {
                test: (text: string) => void;
                toggleEditing: () => void;
                makeSpanned: () => Node<any>;
                format: (tagName: string, selection: TextSelection) => void;

            },
            data: TextNodeData;
        }
    }
}

export default createModel({
    name: "text",
    label: "Text",
    extends: "element",
    default: {
        tagName: "p",
        data: {
            text: "Hello, World!",
            editing: false
        }
    },
    commands: commands,
    component: TextComponent,
    onCreate(node) {
        node.on("hover", (hovered) => {
            console.log(node.element, " is Hovered", hovered);
        });

        node.on("select", () => {
            console.log(node.element, " is Selected");
        });
    }
});