import type { ComponentProps } from "@/types/model";
import React, { useEffect, useState } from "react";

export default function ElementComponent({ node, children, ref }: ComponentProps<"element", HTMLDivElement>) {
    const [hovered, setHovered] = useState(false);
    const [selected, setSelected] = useState(false);
    const TagName = (node.tagName || "div") as React.ElementType;

    useEffect(() => {
        const onHovered = (hovered: boolean) => setHovered(hovered);
        const onSelected = (selected: boolean) => setSelected(selected);
        const unsubscribers = [node.on("hover", onHovered), node.on("select", onSelected)];
        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [node]);

    return (
        <TagName
            style={{
                outline: selected ? "1px solid blue" : hovered ? "1px solid red" : "none",
            }}
            ref={ref}
        >
            {children}
        </TagName>
    );
}
