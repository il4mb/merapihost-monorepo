import { NodeModel, useNodeInternal, useWireEffect } from "@/libs/node";
import { Typography } from "@mui/material";
import { BoldIcon, ItalicIcon, TypeIcon, UnderlineIcon, RemoveFormatting, LinkIcon } from "lucide-react";
import { JSX } from "react/jsx-runtime";
import { useCallback, useEffect } from "react";
import { useNodes } from "@/contexts";
import RenderEditing from "./RenderEditing";
import { useNodeDescendantsRef } from "@/hooks/useNodes";
import { applyFormatted, getTextNodes } from "./tools";
import { createType } from "@/libs/node/createType";

export type TextTypeData = {
    editing: boolean;
    formats: string[];
};
export const TextType = createType<TextTypeData>(
    ({ node, children, ref }) => {
        const { invokeCommand } = useNodeInternal();
        const { dispatch } = useNodes();
        const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;
        const descendantsRef = useNodeDescendantsRef(node);

        const clearWindowSelection = useCallback(() => {
            // clear both selection
            const win = node.dom?.ownerDocument?.defaultView;
            window?.getSelection()?.removeAllRanges();
            win?.getSelection()?.removeAllRanges();
        }, [node.dom]);

        const prepareStartEditing = useCallback(() => {
            if (node.data.editing) return;
            const descendants = Array.from(descendantsRef.current.values());
            const payloads = descendants.map((n) => ({
                type: "UPDATE_NODE",
                payload: { id: n.id, selectable: false, hoverable: false },
            })) as any[];
            dispatch({ type: "SET_SELECTED", payload: node.id });
            setTimeout(() => {
                dispatch({
                    type: "BULK",
                    payload: [
                        {
                            type: "UPDATE_NODE",
                            payload: { id: node.id, data: { editing: true } },
                        },
                        ...payloads,
                    ],
                });
                clearWindowSelection();
            }, 50);
        }, [descendantsRef, dispatch, node.id, node.data.editing, clearWindowSelection]);

        const prepareStopEditing = useCallback(() => {
            if (!node.data.editing) return;
            const descendants = Array.from(descendantsRef.current.values());
            const payloads = descendants.map((n) => ({
                type: "UPDATE_NODE",
                payload: { id: n.id, selectable: true, hoverable: true },
            })) as any[];
            dispatch({
                type: "BULK",
                payload: [
                    {
                        type: "UPDATE_NODE",
                        payload: { id: node.id, data: { editing: false }, selectable: true, hoverable: true },
                    },
                    ...payloads,
                ],
            });
            clearWindowSelection();
        }, [descendantsRef, dispatch, node.id, node.data.editing, clearWindowSelection]);

        const handleDoubleClick = useCallback(() => {
            invokeCommand("startEditing");
        }, [invokeCommand]);

        useWireEffect("startEditing", prepareStartEditing, [prepareStartEditing]);
        useWireEffect("stopEditing", prepareStopEditing, [prepareStopEditing]);

        useEffect(() => {
            // blur detection
            if (!node.data.editing) return;
            return prepareStopEditing;
        }, [node.data.isSelected, node.data.editing, prepareStopEditing]);

        return (
            <Typography
                component={tagName}
                {...node.props}
                onDoubleClick={handleDoubleClick}
                sx={{
                    ...node.props.sx,
                    "&:empty:before": {
                        content: '"Empty"',
                        fontStyle: "italic",
                        color: "#ccc",
                    },
                    ...(node.data.editing
                        ? {
                              position: "relative",
                              userSelect: "none",
                              cursor: "text",
                              minHeight: "1.2em",
                          }
                        : {}),
                }}
                ref={ref}
            >
                {node.data.editing ? <RenderEditing root={node} /> : node.content ? node.content : children}
            </Typography>
        );
    },
    {
        name: "Text",
        extends: "Element",
        icon: TypeIcon,
        draggable: true,
        accepts: ["formatted"],
        data: {
            editing: false,
            formats: [],
        },
        isInstance(target) {
            const supportedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a"];
            return supportedTags.includes(String(target.tagName).toLowerCase()) || typeof target.content === "string";
        },
        default: {
            name: (ctx) => String(ctx?.node?.tagName || "span"),
            props: {
                sx: {
                    userSelect: "none",
                    whiteSpace: "break-spaces",
                },
            },
        },
        actions: (node) => {
            if (!node.data.editing) {
                return {
                    clearFormat: {
                        icon: RemoveFormatting,
                        title: "clear formatted",
                        disabled: Boolean(node.content),
                        order: 0,
                    },
                };
            }
            return {
                clearFormat: {
                    icon: RemoveFormatting,
                    title: "clear formatted",
                    disabled: Boolean(node.content),
                },
                link: {
                    icon: LinkIcon,
                    active: node.data.formats.includes("a"),
                },
                bold: {
                    icon: BoldIcon,
                    active: node.data.formats.includes("strong"),
                },
                italic: {
                    icon: ItalicIcon,
                    active: node.data.formats.includes("em"),
                },
                underline: {
                    icon: UnderlineIcon,
                    active: node.data.formats.includes("u"),
                },
                delete: false,
                parent: false,
            };
        },
        commands: {
            bold({ context }) {
                context.command("applyFormat", { format: "bold" });
            },
            italic({ context }) {
                context.command("applyFormat", { format: "italic" });
            },
            underline({ context }) {
                context.command("applyFormat", { format: "underline" });
            },
            link({ context }) {
                context.command("applyFormat", { format: "link" });
            },
            clearFormat({ context, node }) {
                const textNodes = getTextNodes(context.getDescendants(), node);
                const contents = textNodes.map((n) => n.content);
                context.update({ content: contents.join(""), data: { formats: [] } });
                context.updateChildren(new Map());
            },

            applyFormat({ context, format, node }) {
                const selection = context.command("selection");
                if (!selection) {
                    console.warn("Selection is missing");
                    return;
                }
                const descendants = context.getDescendants();
                const updatedContents = applyFormatted({ format, descendants, selection, node });

                if (updatedContents) {
                    let content;
                    if (updatedContents.size === 1) {
                        const [firstValue] = updatedContents.values();
                        if (firstValue.tagName === "span") {
                            content = firstValue.content;
                            updatedContents.delete(firstValue.id);
                        }
                    }

                    context.update({ content });
                    context.updateChildren(updatedContents);
                    // console.log(selection);
                    setTimeout(() => {
                        context.withNode(node, () => context.command("renderCaret"));
                    }, 50);
                }
            },

            getRootText({ context, node }) {
                const ancestors = context.getAncestors();
                if (!node.type.isText) return node;
                let rootTextNode = node;
                let parentNode = ancestors.get(node.parent || "");

                // Keep walking UP the tree as long as the parent exists and IS a text node
                while (parentNode && parentNode.type.isText) {
                    rootTextNode = parentNode as any;
                    parentNode = ancestors.get(rootTextNode.parent || "");
                }
                return rootTextNode;
            },

            startEditing({ context }) {
                const rootText = context.command("getRootText") as NodeModel<TextTypeData>;
                if (rootText && !rootText.data.editing) {
                    return rootText.type.invokeCommand("startEditing", context);
                }
                // console.log("Won't start editing wire not connected to component");
            },

            stopEditing({ context }) {
                const rootText = context.command("getRootText") as NodeModel<TextTypeData>;
                if (rootText && rootText.data.editing) {
                    return rootText.type.invokeCommand("stopEditing", context);
                }
                // console.log("Won't stop editing wire not connected to component");
            },
        },
    },
);
