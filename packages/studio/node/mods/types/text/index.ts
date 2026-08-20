import { Model } from "@nodes/engine/Model";
import TextComponent, { TextComponentProps } from "./TextComponent";

export default new Model<TextComponentProps>({
    component: TextComponent,
    state: () => {
        return {
            text: "Hello, World!",
        }
    },
    name: "Text",
    extends: "element",
});