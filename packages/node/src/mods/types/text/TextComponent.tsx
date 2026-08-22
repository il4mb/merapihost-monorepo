import type { ComponentProps } from "@/types/model";

export default function TextComponent({ ref, children, node }: ComponentProps<"text">) {
    const Component = node.model.extends.component;
    return (
        <Component ref={ref} node={node}>
            {node.data.text}
        </Component>
    );
}
