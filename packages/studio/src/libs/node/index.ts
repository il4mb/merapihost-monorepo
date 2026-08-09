import { TypeComponent } from "@/types";
import { ElementNode } from "./types/ElementNode";
import { RootNode } from "./types/RootNode";

export const REGISTRY: Record<string, TypeComponent<unknown>> = {
    "Element": ElementNode,
    "Root": RootNode
};

export {
    ElementNode,
    RootNode
}