import { Model } from "@nodes/engine/Model";
import ElementComponent, { ElementComponentProps } from "./ElementComponent";

export default new Model<ElementComponentProps>({
    component: ElementComponent,
    state: () => {
        return {
            
        }
    },
    name: "Element",
});