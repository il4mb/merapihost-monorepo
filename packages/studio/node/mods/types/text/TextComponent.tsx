import type { ComponentProps } from "@nodes/types/type";

export default function TextComponent({ ref, children, node }: ComponentProps<"text">) {
    return (
        <div>
            {/* TextComponent content goes here */}
            <h1>TextComponent</h1>
        </div>
    );
}
