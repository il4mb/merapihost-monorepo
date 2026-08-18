import type { Block } from "@/types";
import { GridBlock, GridItemBlock } from "./GridBlock";
import { TEXT_BLOCKS } from "./Typography";
import { ContainerBlock, BoxBlock } from "./Container";
import { MEDIA_BLOCKS } from "./MediaBlock";
import { BUTTONS_BLOCKS } from "./Button";

export const BLOCKS = [
    GridBlock,
    GridItemBlock,
    ContainerBlock,
    BoxBlock,
    ...TEXT_BLOCKS,
    ...BUTTONS_BLOCKS,
    ...MEDIA_BLOCKS,
] as Block[];
