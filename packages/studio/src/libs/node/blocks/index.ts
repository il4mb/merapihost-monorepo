import type { Block } from "@/types";
import { GridBlock, GridItemBlock } from "./GridBlock";
import { TypographyBlock, HeadingBlock } from "./Typography";
import { ContainerBlock, BoxBlock } from "./Container";
export const BLOCKS = [
    GridBlock,
    GridItemBlock,
    ContainerBlock,
    BoxBlock,
    TypographyBlock,
    HeadingBlock
] as Block[];