import type { Node } from "@/engine";
import { commands } from "./commands";
import { createModel } from "@/mods";
import TextComponent from "./TextComponent";
import { InferCommand } from "@/types/model";

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

type Test = InferCommand<"text">['test'];

type ss = InferCommand<'text', false>

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
    onChildAdd(child) {
        // disable interaction when the parent is editing
        child.selectable = !child.parent.data.editing;
        child.hoverable = !child.parent.data.editing;
    },
});