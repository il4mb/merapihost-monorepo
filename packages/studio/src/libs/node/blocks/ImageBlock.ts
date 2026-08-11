import { Block } from "@/types";
import { ImageIcon } from "lucide-react";

export const ImageBlock = {
    label: "Image",
    category: "Media",
    icon: ImageIcon,
    content: {
        type: "Image",
        props: {
            src: "https://picsum.photos/300/300",
            alt: "Placeholder Image",
            width: 150,
            height: 150,
        }
    }

} as Block;