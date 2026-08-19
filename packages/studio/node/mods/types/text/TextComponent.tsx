import { TypeProps } from "@nodes";

export type TextComponentProps = {
    text: string;
};

export default function TextComponent({ ref, children }: TypeProps<TextComponentProps>) {
    return (
        <div>
            {/* TextComponent content goes here */}
            <h1>TextComponent</h1>
        </div>
    );
}
