import ElementComponent from "./ElementComponent";
import { createModel } from "@nodes/mods";

declare module "@nodes/registry" {
    interface TypeRegistry {
        element: {
            commands: {
                // hallo: () => void;
            }
        }
    }
}

export default createModel({
    component: ElementComponent,
    state: () => {
        return {

        }
    },
    commands: {},
    name: "element",
    label: "Element",
})