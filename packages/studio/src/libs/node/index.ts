import { TypeComponent } from "@/types";
import NodeRender from "./NodeRender"; // Not a type node

// START of type nodes
import { ElementNode } from "./types/ElementNode";
import { RootNode } from "./types/RootNode";
import { TextNode, Text } from "./types/TextNode";
import { GridType, GridItemType } from "./types/GridNode";
import { ImageNode } from "./types/ImageNode";
import { ContainerType } from "./types/ContainerType";
import { VideoType } from "./types/VideoType";
import { YoutubeType } from "./types/YoutubeType";
import { GoogleMapType } from "./types/GoogleMapType";
// END of type nodes


export const REGISTRY: Record<string, TypeComponent<unknown>> = {
    "textnode": TextNode,
    "Element": ElementNode,
    "Root": RootNode,
    "Text": Text,
    "Grid": GridType,
    "GridItem": GridItemType,
    "Image": ImageNode,
    "Container": ContainerType,
    "Video": VideoType,
    "Youtube": YoutubeType,
    "GoogleMap": GoogleMapType
};

export {
    ElementNode,
    RootNode,
    NodeRender
}


export * from "./tools";
export * from "./ModelProxy";
export * from "./NodeModel";
export * from "./nodeReducer";
