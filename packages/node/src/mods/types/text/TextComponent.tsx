import type { ComponentProps } from "@/types/model";

export default function TextComponent({ ref, children, node }: ComponentProps<"text">) {
    return (
        <div>
            {/* TextComponent content goes here */}
            <h1>TextComponent</h1>
        </div>
    );
}
