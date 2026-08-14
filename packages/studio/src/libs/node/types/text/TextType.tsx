import { Typography } from "@mui/material";
import { TypeIcon } from "lucide-react";
import { createType } from "../../tools";
import { JSX } from "react/jsx-runtime";
import { useCallback, useRef, useLayoutEffect } from "react";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { useInternalNode } from "../../InternalNode";
import RenderEditing from "./RenderEditing";
import { useNodeDescendantsRef } from "@/hooks/useNodes";
import { NodeModel } from "../../NodeModel"; // adjust path
import { getGlobalCharOffsets, setGlobalCharOffsets } from "./tools"; // adjust path

export const TextType = createType(({ node, children, ref }) => {
    const { data, setData } = useInternalNode<{ editing: boolean }>();
    const { dispatch } = useNodesReducer();
    const tagName = (node.tagName || "span") as keyof JSX.IntrinsicElements;
    const descendantsRef = useNodeDescendantsRef(node);
    const pendingTypingSelectionRef = useRef<{ start: number; end: number } | null>(null);
   
    const disableChildInteractions = useCallback(() => {
        const descendants = Array.from(descendantsRef.current.values());
        const payloads = descendants.map((n) => ({
            type: "UPDATE_NODE",
            payload: { id: n.id, selectable: false, hoverable: false }
        }));
        dispatch({ type: "BULK", payload: payloads as any[] });
    }, [descendantsRef, dispatch]);

    const enableChildInteractions = useCallback(() => {
        const descendants = Array.from(descendantsRef.current.values());
        const payloads = descendants.map((n) => ({
            type: "UPDATE_NODE",
            payload: { id: n.id, selectable: true, hoverable: true }
        }));
        dispatch({ type: "BULK", payload: payloads as any[] });
    }, [descendantsRef, dispatch]);

    const handleDoubleClick = useCallback(() => {
        if (data.editing) return;
        const el = ref.current;
        if (data.isSelected && el) {
            disableChildInteractions();
            setData((prev) => ({ ...prev, editing: true, isDraggable: false }));
            requestAnimationFrame(() => el.focus());
        } else {
            setData((prev) => ({ ...prev, editing: false, isDraggable: true }));
        }
    }, [data.isSelected, data.editing, ref, setData, disableChildInteractions]);

    const stopEditing = useCallback(() => {
        setData((prev) => ({ ...prev, editing: false, isDraggable: true }));
        enableChildInteractions();
    }, [setData, enableChildInteractions]);

    // ── NEW: on blur, sync the live DOM text back to state ──
    const handleBlur = useCallback(() => {
        if (!data.editing) return;

        const el = ref.current;
        if (el) {
            const newContents = new Map(descendantsRef.current);
            let hasChanges = false;

            // Walk the DOM and update any text nodes that changed
            descendantsRef.current.forEach((descendant) => {
                if (descendant.type.name.toLowerCase() === "textnode" && descendant.dom) {
                    const liveText = descendant.dom.textContent || "";
                    if (liveText !== (descendant.content || "")) {
                        const updated = new NodeModel(descendant);
                        updated.content = liveText;
                        newContents.set(descendant.id, updated);
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges) {
                dispatch({ type: "SET_NODE_CHILDREN", payload: { id: node.id, children: newContents } });
            }
        }

        stopEditing();
    }, [data.editing, dispatch, node.id, stopEditing, descendantsRef, ref]);

    // ── NEW: onInput only updates the REF and saves cursor position ──
    // NO dispatch here — that prevents the removeChild error
    const handleInput = useCallback((e: React.FormEvent<HTMLElement>) => {
        if (!data.editing) return;
        
        const el = e.currentTarget;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !el) return;
        
        // 1. Save cursor
        pendingTypingSelectionRef.current = getGlobalCharOffsets(el, selection.getRangeAt(0));
        
        // 2. Update the live ref so formatting operations see current text
        //    (we mutate the ref directly, no React re-render)
        descendantsRef.current.forEach((descendant) => {
            if (descendant.type.name.toLowerCase() === "textnode" && descendant.dom) {
                const liveText = descendant.dom.textContent || "";
                if (liveText !== (descendant.content || "")) {
                    // Mutate the ref map in-place so RenderEditing sees it
                    (descendant as any).content = liveText;
                }
            }
        });
    }, [data.editing, descendantsRef]);

    // 3. Restore cursor after any re-render (e.g. from formatting)
    useLayoutEffect(() => {
        if (pendingTypingSelectionRef.current && ref.current) {
            const { start, end } = pendingTypingSelectionRef.current;
            setGlobalCharOffsets(ref.current, start, end);
            pendingTypingSelectionRef.current = null;
        }
    });

    return (
        <Typography
            component={tagName}
            {...node.props}
            onDoubleClick={handleDoubleClick}
            onBlur={handleBlur}
            onInput={handleInput}
            contentEditable={data.editing}
            suppressContentEditableWarning={true}
            ref={ref}>
            {data.editing ? (
                <RenderEditing root={node} />
            ) : children}
        </Typography>
    );
}, {
    name: "Text",
    extends: "Element",
    icon: TypeIcon,
    draggable: true,
    accepts: ["textnode", "formatted"],
    data: { editing: false },
    isInstance(target) {
        const supportedTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "a"];
        return supportedTags.includes(String(target.tagName).toLowerCase());
    },
    default: {
        name: (ctx) => String(ctx?.node?.tagName || "span"),
    },
});