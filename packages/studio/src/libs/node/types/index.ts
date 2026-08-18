import { FormatNodeType, TextType } from "./text";

import { ContainerType } from "./ContainerType";
import { ElementType } from "./ElementType";
import { GoogleMapType } from "./GoogleMapType";
import { GridType, GridItemType } from "./GridType";
import { ImageType } from "./ImageType";
import { RootType } from "./RootType";
import { VideoType } from "./VideoType";
import { YoutubeType } from "./YoutubeType";
import { ButtonType } from "./ButtonType";

export const REGISTRY = {
    // core types
    "root": RootType,
    "text": TextType,
    "spanned": FormatNodeType,

    // other types
    "container": ContainerType,
    "element": ElementType,
    "grid": GridType,
    "griditem": GridItemType,
    "image": ImageType,
    "button": ButtonType,
    "video": VideoType,
    "youtube": YoutubeType,
    "googlemap": GoogleMapType,
} as const;