import type { ComponentProps } from "@/types/model";

export default function ElementComponent({ node }: ComponentProps<"element">) {
    const TagName = node.tagName || "div";
    return (
        <TagName>
            <h1>ElementComponent</h1>
        </TagName>
    );
}
