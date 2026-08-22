import ElementComponent from "./ElementComponent";
import { createModel } from "@/mods";

declare global {
    interface ModelRegistry {
        element: {
            commands: {
                // hallo: () => void;
            }
        }
    }
}

export default createModel({
    component: ElementComponent,
    commands: {},
    name: "element",
    label: "Element"
})