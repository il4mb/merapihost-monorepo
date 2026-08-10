import type { Block } from "@/types";
import { GridBlock, GridItemBlock } from "./GridBlock";
import { TypographyBlock, HeadingBlock } from "./Typography";

export const BLOCKS = [
    GridBlock,
    GridItemBlock,
    TypographyBlock,
    HeadingBlock
] as Block[];