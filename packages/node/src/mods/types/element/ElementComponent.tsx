import type { ComponentProps } from "@/types/model";
import React from "react";

export default function ElementComponent({ node, children, ref }: ComponentProps<"element", HTMLDivElement>) {
    const TagName = (node.tagName || "div") as React.ElementType;

    return (
        <TagName ref={ref}>
            <h1>ElementComponent</h1>
            {children}
        </TagName>
    );
}
