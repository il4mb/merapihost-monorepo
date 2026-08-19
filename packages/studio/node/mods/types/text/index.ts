import { TypeModel } from "@nodes/cores";
import TextComponent, { TextComponentProps } from "./TextComponent";

export default new TypeModel<TextComponentProps>({
    component: TextComponent,
    state: () => {
        return {
            text: "Hello, World!",
            
        }
    },
    name: "Text",
});