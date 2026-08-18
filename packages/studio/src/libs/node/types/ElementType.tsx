import { Box } from "@mui/material";
import { Delete, Maximize, Square } from "lucide-react";
import { createType } from "@/libs/node/createType";
import type { JSX } from "react/jsx-runtime";
import { useDragging } from "@/contexts/DraggingProvider";

const VOID_ELEMENTS = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
]);

export const ElementType = createType(({ node, children, ref }) => {

    const { dragging } = useDragging();
    const tagName = (node.tagName || "div").toLowerCase() as keyof JSX.IntrinsicElements;
    const isVoidTag = VOID_ELEMENTS.has(tagName);

    if (isVoidTag) {
        return (
            <Box component={tagName} {...node.props} ref={ref} />
        );
    }

    return (
        <Box
            component={tagName}
            {...node.props}
            sx={{
                ...node.props.sx,
                transition: "all .2s ease-in-out",
                ...(dragging ? {
                    minWidth: 15,
                    minHeight: 15,
                    pb: 2.5,
                    outline: "1px dashed red"
                } : {})
            }}
            ref={ref}>
            {children}
        </Box>
    );
}, {
    name: "Element",
    icon: Square,
    data: {
        element: true
    },
    draggable: true,
    default: {
        name(ctx) {
            return ctx?.node?.tagName || "Element";
        }
    },
    actions: {
        parent: {
            icon: Maximize,
            title: "select parent",
            order: 1
        },
        delete: {
            icon: Delete,
            order: 2
        }
    },
    commands: {
        parent: ({ node, context }) => {
            const parentNode = context.getParent();
            // console.log(node.id, parentNode.id); // 1234, 123

            if (parentNode) {
                parentNode.type.invokeCommand("select", context);
            }
        },

        delete: ({ context }) => {
            context.delete();
        },

        select: ({ context, node }) => {
            // console.log("trigger select", node.id); // 123
            context.select(); // but in reducer it become 1234
        }
    }
});