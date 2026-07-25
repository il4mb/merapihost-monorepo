import { BlockNode } from "@/types";
import { JSX } from "react/jsx-runtime";
import { REGISTRIES } from "../constants";

interface Props {
    block: BlockNode;
    blocks: BlockNode[];
}

export default function BlockElement({ block, blocks }: Props) {
    if (block.type === "textnode") {
        return <>{block.props.content}</>;
    }

    const TagName = (block.tagName ?? "div") as keyof JSX.IntrinsicElements;
    const children = blocks.filter(child => child.parent === block.id);
    const Element = (REGISTRIES[block.type] || TagName) as unknown as keyof JSX.IntrinsicElements;
  
    return (
        <Element {...block.props}>
            {children.map(child => (
                <BlockElement
                    key={child.id}
                    block={child}
                    blocks={blocks}
                />
            ))}
        </Element>
    );
}