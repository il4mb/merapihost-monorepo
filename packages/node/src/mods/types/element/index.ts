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
    state: () => {
        return {

        }
    },
    commands: {},
    name: "element",
    label: "Element",
    // onCreate(node) {
    //     console.log("Created", node);
    // },
    // onMount(node) {
    //     console.log("Mounted", node.elementRef.current);
    // },
})