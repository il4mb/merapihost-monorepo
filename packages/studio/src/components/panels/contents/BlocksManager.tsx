import { Typography, Divider, Box, IconButton, Stack, Tooltip } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { useState, useEffect, memo } from "react";
import { AnimatePresence, motion } from "motion/react";
import ScrollContainer from "@/components/ui/ScrollContainer";
import { BLOCKS } from "@/libs/node/blocks";
import { Block } from "@/types";

export default function BlocksManager() {

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [groupedBlocks, setGroupedBlocks] = useState<Record<string, Block[]>>({});

    const onToggleCategory = (category: string) => {
        setExpanded(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    }

    useEffect(() => {
        const grouped: Record<string, Block[]> = {};
        BLOCKS.forEach(block => {
            const category = block.category || "General";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(block);
        });
        setExpanded(prev => {
            const firstCategory = Object.keys(grouped)[0];
            const newExpanded = { ...prev };
            Object.keys(grouped).forEach(category => {
                if (!(category in newExpanded)) {
                    newExpanded[category] = category === firstCategory;
                }
            });
            return newExpanded;
        });
        setGroupedBlocks(grouped);
    }, []);

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.2 }}>
                <Typography variant="overline" sx={{ px: 1, display: "block", fontWeight: 600 }}>
                    Blocks
                </Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />

            <ScrollContainer>
                {Object.entries(groupedBlocks).map(([category, blocks]) => (
                    <GroupBlocks
                        key={category}
                        category={category}
                        blocks={blocks}
                        expanded={expanded[category] ?? false}
                        onToggle={onToggleCategory}
                    />
                ))}
            </ScrollContainer>
        </Box>
    );
}


type GroupBlocksProps = {
    category: string;
    blocks: Block[];
    expanded: boolean;
    onToggle?: (category: string) => void;
};
const GroupBlocks = memo(({ category, blocks, expanded, onToggle }: GroupBlocksProps) => {
    return (
        <Box>
            <Stack
                direction="row"
                sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1, py: 0.5,
                    cursor: "pointer"
                }}
                onClick={() => onToggle?.(category)}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {category}
                </Typography>
                <IconButton size="small" sx={{ p: 0, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                    <ChevronDown size={16} />
                </IconButton>
            </Stack>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}>
                        <Box sx={{
                            display: "flex",
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: .5, px: 1, mb: 2
                        }}>
                            {blocks.map((block) => (
                                <BlockItem key={block.label} block={block} />
                            ))}
                        </Box>
                    </motion.div>
                )}
            </AnimatePresence>
        </Box>
    );
});


const BlockItem = memo(({ block }: { block: Block }) => {

    const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("studio/block", JSON.stringify(block));
        e.dataTransfer.effectAllowed = "copy";
    }

    return (
        <Tooltip title={block.label} placement="top" arrow>
            <Box
                draggable
                onDragStart={onDragStart}
                sx={{
                    flex: "1 0 100px",
                    minHeight: 60,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 0.5,
                    p: .75,
                    borderRadius: .25,
                    cursor: "pointer",
                    userSelect: "none",
                    backgroundColor: "action.hover",
                    "&:hover": {
                        backgroundColor: "action.selected"
                    }
                }}>
                {block.icon && <block.icon size={14} />}
                <Typography
                    variant="body2"
                    sx={{
                        fontSize: 10, textAlign: "center",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                    }}>
                    {block.label}
                </Typography>
            </Box>
        </Tooltip>
    );
});