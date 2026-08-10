import { TypeComponent } from "@/types";
import NodeRender from "./NodeRender"; // Not a type node

// START of type nodes
import { ElementNode } from "./types/ElementNode";
import { RootNode } from "./types/RootNode";
import { TextNode } from "./types/TextNode";
import { GridType, GridItemType } from "./types/GridNode";

// END of type nodes


export const REGISTRY: Record<string, TypeComponent<unknown>> = {
    "Element": ElementNode,
    "Root": RootNode,
    "Text": TextNode,
    "Grid": GridType,
    "GridItem": GridItemType
};

export {
    ElementNode,
    RootNode,
    NodeRender
}


export * from "./tools";   