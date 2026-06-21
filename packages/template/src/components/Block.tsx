import { Box, SxProps } from "@mui/material";
import { createType } from "../tools";

type BlockProps = {
    children?: React.ReactNode;
    sx?: SxProps;
}
export const Block = createType<BlockProps>(({ children, sx, ref }) => {
    return (
        <Box sx={sx} ref={ref}>
            {children}
        </Box>
    );
}, {
    name: "Block"
});