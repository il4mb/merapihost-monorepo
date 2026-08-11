import type { Block } from "@/types";
import { GridBlock, GridItemBlock } from "./GridBlock";
import { TypographyBlock, HeadingBlock } from "./Typography";
import { ContainerBlock, BoxBlock } from "./Container";
import { ImageBlock } from "./ImageBlock";
export const BLOCKS = [
    GridBlock,
    GridItemBlock,
    ContainerBlock,
    BoxBlock,
    TypographyBlock,
    HeadingBlock,
    ImageBlock,
] as Block[];