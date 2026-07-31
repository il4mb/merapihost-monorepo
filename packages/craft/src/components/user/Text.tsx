interface TextProps {
    text: string;
}

export const Text = ({ text }: TextProps) => {
    return (
        <p>{text}</p>
    );
}