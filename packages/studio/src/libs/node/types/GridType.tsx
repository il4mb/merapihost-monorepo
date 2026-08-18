import { createType } from "@/libs/node/createType";
import { Grid2X2Icon, LayoutPanelLeft } from "lucide-react";
import { Grid } from "@mui/material";

export const GridType = createType(({ node, children, ref }) => {

    return (
        // @ts-ignore
        <Grid container {...node.props} ref={ref}>
            {children}
        </Grid>
    );
}, {
    name: "Grid",
    icon: Grid2X2Icon,
    isInstance(target) {
        return target.type === "Grid";
    },
    draggable: true, // Grid can be dragged
    droppable: true, // Grid can drop to any
    accepts: ["GridItem"], // Grid can only accept GridItem as children
    default: {
        name(ctx) {
            return ctx.node.tagName || "Grid";
        }
    }
});


export const GridItemType = createType(({ node, children, ref }) => {

    return (
        // @ts-ignore
        <Grid  {...node.props} ref={ref}>
            {children}
        </Grid>
    );
}, {
    name: "GridItem",
    icon: LayoutPanelLeft,
    isInstance(target) {
        return target.type === "GridItem";
    },
    draggable: true,
    droppable: ['Grid'], // GridItem can drop to Grid type nodes
    default: {
        name(ctx) {
            return ctx.node.tagName || "Grid Item";
        },
        props: {
            size: {
                xs: 12,
                sm: 6,
                md: 4,
                lg: 3
            }
        }
    }
});