import { createType } from "@/libs/node";
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
    draggable: true,
    droppable: ["GridItem"],
    default: {
        name() {
            return this.node.tagName || "Grid";
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
    accepts: ["Grid"],
    default: {
        name() {
            return this.node.tagName || "Grid Item";
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