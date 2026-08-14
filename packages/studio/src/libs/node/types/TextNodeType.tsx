import { BinaryIcon } from "lucide-react";
import { createType } from "../tools";
import { createElement, JSX, useCallback, useEffect } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { useInternalNode } from "../InternalNode";

// TextNode sekarang HANYA leaf raw text — tagName di sini murni elemen HTML pembungkus
// default (biasanya "span"), BUKAN representasi format lagi.
export const TEXT_NODE_TAGS = ["span"];

export const TextNodeType = createType(({ node, ref }) => {
    const { data } = useInternalNode<{ isEditing: boolean }>();
    const { state: { collection }, dispatch } = useNodesReducer();

    const findParentTextType = useCallback(() => {
        let currentNode = node;
        while (currentNode) {
            const parentNode = collection.get(currentNode.parent || "");
            if (!parentNode) break;
            if (parentNode.type.name === "Text") {
                return parentNode;
            }
            currentNode = parentNode;
        }
        return null;
    }, [collection]);

    const onDoubleClick = useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        if (data.isEditing) {
            e.stopPropagation();
            return;
        }
        const parentTextNode = findParentTextType();
        if (parentTextNode && parentTextNode.dom) {
            dispatch({ type: "SET_SELECTED", payload: parentTextNode.id });
            setTimeout(() => {
                parentTextNode.dom?.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
            }, 50);
        }
    }, [findParentTextType, data]);

    const TagName = (node.tagName || "span").toLowerCase() as keyof JSX.IntrinsicElements;
    const FinalTagName = TEXT_NODE_TAGS.includes(TagName) ? TagName : "span";

    // Leaf murni: tidak pernah render children, hanya raw content.
    return createElement(FinalTagName, { ref, ...node.props, onDoubleClick }, node.content || null);
}, {
    name: "TextNode",
    icon: BinaryIcon,
    draggable: true,
    droppable: ["TextNode"],
    accepts: [], // tetap tidak menerima children apapun
    isInstance(target) {
        return String(target.type || "").toLowerCase() === "textnode";
    },
    default: {
        name: "textnode",
        tagName: "span",
    }
});