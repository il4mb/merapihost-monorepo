import { motion } from 'framer-motion';

interface MenuIconProps {
    open: boolean;
    width?: number;
    height?: number;
}

export default function MenuIcon({ open, width = 24, height = 24 }: MenuIconProps) {

    const strokeWidth = open ? 2 : 2.5;
    const startX = width / 6;
    const endX = width - startX;

    const topY = height / (open ? 5 : 4);
    const centerY = height / 2;
    const bottomY = height - topY;

    return (
        <motion.svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            initial={false}
            aria-hidden="true">
            {/* Top Line */}
            <motion.line
                x1={startX} x2={endX}
                y1={topY} y2={topY}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                animate={{
                    y1: open ? bottomY : topY,
                    y2: open ? topY : topY
                }}
                transition={{ duration: 0.25 }}
            />

            {/* Middle Line */}
            <motion.line
                x1={startX} x2={endX}
                y1={centerY} y2={centerY}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                animate={{ opacity: open ? 0 : 1 }}
                transition={{ duration: 0.2 }}
            />

            {/* Bottom Line */}
            <motion.line
                x1={startX} x2={endX}
                y1={bottomY} y2={bottomY}
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                animate={{
                    y1: open ? topY : bottomY,
                    y2: open ? bottomY : bottomY
                }}
                transition={{ duration: 0.25 }}
            />
        </motion.svg>
    )
}