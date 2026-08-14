import { TextNodeType } from "./TextNodeType";
import { FormatNodeType, TextType } from "./text";

import { ContainerType } from "./ContainerType";
import { ElementType } from "./ElementType";
import { GoogleMapType } from "./GoogleMapType";
import { GridType, GridItemType } from "./GridType";
import { ImageType } from "./ImageType";
import { RootType } from "./RootType";
import { VideoType } from "./VideoType";
import { YoutubeType } from "./YoutubeType";

export const REGISTRY = {
    // core types
    "root": RootType,
    "textnode": TextNodeType,
    "text": TextType,
    "formatted": FormatNodeType,

    // other types
    "container": ContainerType,
    "element": ElementType,
    "grid": GridType,
    "griditem": GridItemType,
    "image": ImageType,
    "video": VideoType,
    "youtube": YoutubeType,
    "googlemap": GoogleMapType,
} as const;