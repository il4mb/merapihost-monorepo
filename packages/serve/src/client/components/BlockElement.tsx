import { BlockNode } from "@/types/client";
import { JSX } from "react/jsx-runtime";
import { REGISTRIES } from "../constants";
import { useEffect } from "react";

interface Props {
    block: BlockNode;
    blocks: BlockNode[];
}

export default function BlockElement({ block, blocks }: Props) {

    // useEffect(() => {
    //     // console.log(`Rendering block: ${block.id} of type ${block.type}`);
    // }, [block, blocks]);

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