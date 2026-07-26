import { BlockNode } from "@/types/client";
import { JSX } from "react/jsx-runtime";
import { REGISTRIES } from "../constants";
import { useEffect, useRef } from "react";

interface Props {
    block: BlockNode;
    blocks: BlockNode[];
}

export default function BlockElement({ block, blocks }: Props) {

    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        element.addEventListener("*", (event) => {
            console.log("Event triggered:", event.type, "on element:", element);
        });

        return () => {
            element.removeEventListener("*", () => {});
        };
        
    }, [block, blocks, ref.current]);

    if (block.type === "textnode") {
        return <>{block.props.content}</>;
    }

    const TagName = (block.tagName ?? "div") as keyof JSX.IntrinsicElements;
    const children = blocks.filter(child => child.parent === block.id);
    const Element = (REGISTRIES[block.type] || TagName) as unknown as keyof JSX.IntrinsicElements;

    return (
        // @ts-ignore
        <Element {...block.props} ref={ref}>
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