import { Block } from "@/types";
import { ImageIcon, VideoIcon } from "lucide-react";
import YoutubeIcon from "@/components/icons/YoutubeIcon";
import MapIcon from "@/components/icons/MapIcon";

export const ImageBlock = {
    label: "Image",
    category: "Media",
    icon: ImageIcon,
    content: {
        type: "Image",
        props: {
            src: "https://picsum.photos/300/300",
            alt: "Placeholder Image"
        }
    }

} as Block;

export const VideoBlock = {
    label: "Video",
    category: "Media",
    icon: VideoIcon,
    content: {
        type: "Video",
        props: {
            src: "http://docs.evostream.com/sample_content/assets/bun33s.mp4",
            alt: "Placeholder Video"
        }
    }

} as Block;

export const YoutubeBlock = {
    label: "YouTube Video",
    category: "Media",
    icon: YoutubeIcon,
    content: {
        type: "Youtube",
        props: {
            src: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            alt: "YouTube Video"
        }
    }

} as Block;

export const GoogleMapsBlock = {
    label: "Google Maps",
    category: "Media",
    icon: MapIcon,
    content: {
        type: "GoogleMap"
    }
} as Block; 

export const MediaBlocks = [ImageBlock, VideoBlock, YoutubeBlock, GoogleMapsBlock] as Block[];