import { Model } from "@nodes/engine/Model";
import ElementComponent from "./ElementComponent";

declare module "@nodes/registry" {
    interface TypeRegistry {
        element: {
            commands: {
                hallo: () => void;
            }
        }
    }
}

export default new Model({
    component: ElementComponent,
    state: () => {
        return {
            
        }
    },
    commands: {
        hallo() {

        }
    },
    name: "element",
    label: "Element",
});