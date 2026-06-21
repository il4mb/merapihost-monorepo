import { memo } from "react";

export type PageIconProps = {
    size?: number;
    color?: string;
    thickness?: number;
};

export default memo(({ size = 24, color = "currentColor", thickness = .7 }: PageIconProps) => {
    // The base icon paths are drawn on a 7.44 x 7.44 coordinate grid
    const baseSize = 7.44;

    // Expand the viewBox outward by half the stroke width to prevent clipping
    const margin = (thickness / 2) + 0.75;
    const minX = -margin;
    const minY = -margin;

    // The new total width/height of the viewBox accounts for the stroke on both sides
    const viewBoxSize = baseSize + thickness + 1.25;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox={`${minX} ${minY} ${viewBoxSize} ${viewBoxSize}`}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M1.44 0H6A1.44 1.44 0 0 1 7.44 1.44V6A1.44 1.44 0 0 1 6 7.44H1.44A1.44 1.44 0 0 1 0 6V1.44A1.44 1.44 0 0 1 1.44 0z" />
            <path d="M0 2.5L7.44 2.5" />
        </svg>
    );
});