import { Model } from "@nodes/engine/Model";
import ElementComponent from "./ElementComponent";

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