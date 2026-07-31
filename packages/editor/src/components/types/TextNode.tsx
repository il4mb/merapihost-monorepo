import { createType } from "@editor/tools";

type TextNodeProps = {
    content?: string;
}
export const TextNode = createType(({ content }: TextNodeProps) => content, {
    name: "textnode",
    visibleOnTree: false
});