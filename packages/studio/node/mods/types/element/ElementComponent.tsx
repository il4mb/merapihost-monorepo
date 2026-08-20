import type { ComponentProps } from "@nodes/types/type";

export default function ElementComponent({ node }: ComponentProps<"element">) {
    const TagName = node.tagName || "div";
    return (
        <TagName>
            <h1>ElementComponent</h1>
        </TagName>
    );
}
