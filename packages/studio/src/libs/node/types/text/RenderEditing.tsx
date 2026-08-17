import { useCallback, useMemo, useRef, useEffect, useLayoutEffect, Fragment } from "react";
import { flushSync } from "react-dom";
import { NodeModel } from "../..";
import RenderEditingType from "./RenderEditingType";
import { cleanupEmptyFormatNodes, cloneChainSlice, disableInteractions, findNode, getAncestorChain, isSameFormatTag, mergeAdjacentFormatNodes, normalizeOrders, normalizeTree, setGlobalCharOffsets } from "./tools";
import { useNodes } from "@/contexts";
import { useNodeDescendants } from "@/hooks";
import { ShortcutHandler, useGlobalKeyListener } from "@/contexts/GlobalKeyListenerProvider";
import { nanoid } from "nanoid";
import { getSelectionSegments, useCaretControl } from "@/hooks/useEditText";

const TEMP_ORDER_STEP = 1000;
type RenderEditingProps = { root: NodeModel };

export default function RenderEditing({ root }: RenderEditingProps) {
    const { registerShortcuts } = useGlobalKeyListener();
    const { dispatch } = useNodes();;

    const descendants = useNodeDescendants(root);
    const nodeChildren = useMemo(() => {
        return Array.from(descendants.values())
            .filter((n) => n.parent === root.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [descendants, root.id]);

    const descendantsRef = useRef<Map<string, NodeModel>>(descendants);
    descendantsRef.current = descendants;

    const caretControl = useCaretControl(root, descendantsRef);
    const isFormattingRef = useRef(false);
    const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

    const rootRef = useRef(root);
    useEffect(() => {
        rootRef.current = root;
    }, [root]);

    // Restore native selection (fallback only)
    useLayoutEffect(() => {
        if (pendingSelectionRef.current && root.dom) {
            const { start, end } = pendingSelectionRef.current;
            setGlobalCharOffsets(root.dom, start, end);
            pendingSelectionRef.current = null;
        }
    }, [nodeChildren, root.dom]);

    const getTextNodes = useCallback(() => {
        const root = rootRef.current;
        if (typeof root.content === 'string') return [root];
        return Array.from(descendantsRef.current.values())
            .filter((n) => typeof n.content === 'string')
            .sort((a, b) => {
                if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
                const cmp = a.dom.compareDocumentPosition(b.dom);
                if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                return (a.order || 0) - (b.order || 0);
            });
    }, []);

    const insertFormattedText = useCallback((format: "bold" | "italic" | "underline") => {
        const root = rootRef.current;

        if (isFormattingRef.current) return;
        isFormattingRef.current = true;

        const selection = caretControl.selectionRef.current;
        if (selection.anchor === selection.focus) {
            isFormattingRef.current = false;
            return;
        }

        // Preserve original selection range
        const originalAnchor = selection.anchor;
        const originalFocus = selection.focus;
        const selStart = Math.min(originalAnchor, originalFocus);
        const selEnd = Math.max(originalAnchor, originalFocus);

        const formattedTagName = format === "bold" ? "strong" : format === "italic" ? "em" : "u";
        const newContents = new Map(descendantsRef.current);
        newContents.set(root.id, root); // ensure root 

        const segments = getSelectionSegments(selStart, selEnd, newContents, root);
        if (segments.length === 0) {
            isFormattingRef.current = false;
            return;
        }

        const isAllFormatted = segments.every((seg) => {
            const chain = getAncestorChain(seg.node, newContents, root.id);
            return chain.some((w) => isSameFormatTag(w.tagName, format));
        });
        const targetAction: "APPLY" | "REMOVE" = isAllFormatted ? "REMOVE" : "APPLY";

        segments.forEach((seg, segIdx) => {

            const targetNode = seg.node;
            const targetIsRoot = targetNode.id === root.id;

            const startOffset = seg.localStart;
            const endOffset = seg.localEnd;
            const overlapLength = endOffset - startOffset;
            if (overlapLength === 0) return;

            const originalContent = targetNode.content || "";
            const before = originalContent.slice(0, startOffset);
            const selectedText = originalContent.slice(startOffset, endOffset);
            const after = originalContent.slice(endOffset);
            const hasBefore = before.length > 0;
            const hasAfter = after.length > 0;
            const baseOrder = targetNode.order || 0;
            const originalParentId = targetIsRoot ? root.id : targetNode.parent;

            const chain = getAncestorChain(targetNode, newContents, root.id);
            const matchedIdx = chain.findIndex((w) => isSameFormatTag(w.tagName, format));

            if (targetAction === "APPLY") {
                if (matchedIdx !== -1) return;

                const nodeOrder = targetNode.order || 0;
                const grandParentId = targetNode.parent || root.id;
                const isTargetFormatted = targetNode.type.name.toLowerCase() === "spanned";
                const isFormatTargetEqual = isSameFormatTag(targetNode.tagName, format);

                console.log({
                    nodeOrder,
                    grandParentId,
                    isTargetFormatted,
                    targetIsRoot,
                    targetNode,
                    isFormatTargetEqual
                });



                if (targetIsRoot) {
                    const beforeNode = new NodeModel({
                        id: nanoid(),
                        tagName: "span",
                        type: "spanned",
                        content: before,
                        order: baseOrder,
                        parent: originalParentId
                    });

                    const afterNode = new NodeModel({
                        id: nanoid(),
                        tagName: "span",
                        type: "spanned",
                        content: after,
                        order: baseOrder + 0.02 + segIdx * 0.001,
                        parent: originalParentId
                    });

                    newContents.delete(targetNode.id);
                    if (hasBefore) newContents.set(beforeNode.id, beforeNode);
                    if (hasAfter) newContents.set(afterNode.id, afterNode);

                    if (selectedText.length > 0) {
                        if (chain.length > 0) {
                            // ── Ada ancestor spanned → clone & preserve ──
                            const { innermostId, outermostId } = cloneChainSlice(
                                chain, 0, chain.length - 1, originalParentId, newContents
                            );

                            // Promote cloned wrappers: hapus content supaya jadi container
                            let cleanId = outermostId;
                            while (cleanId) {
                                const n = findNode(cleanId, newContents);
                                if (!n) break;
                                n.content = undefined;
                                const kids = Array.from(newContents.values()).filter(c => c.parent === cleanId);
                                cleanId = kids.length > 0 ? kids[0].id : null;
                            }

                            // Format baru sebagai leaf di dalam innermost clone
                            const newFormatNode = new NodeModel({
                                id: nanoid(),
                                type: "spanned",
                                tagName: formattedTagName,
                                content: selectedText,      // ← leaf mode, langsung content
                                parent: innermostId,
                                order: 0,
                            });

                            newContents.set(newFormatNode.id, newFormatNode);

                            if (outermostId) {
                                const outerNode = findNode(outermostId, newContents);
                                if (outerNode) {
                                    outerNode.order = baseOrder + 0.01 + segIdx * 0.001;
                                }
                            }
                        } else {
                            // ── Tidak ada ancestor → simple spanned leaf ──
                            const wrapper = new NodeModel({
                                id: nanoid(),
                                type: "spanned",
                                tagName: formattedTagName,
                                content: selectedText,
                                parent: originalParentId,
                                order: baseOrder + 0.01 + segIdx * 0.001,
                            });
                            newContents.set(wrapper.id, wrapper);
                        }
                    }
                }

                if (isTargetFormatted) {

                    if (isFormatTargetEqual) {
                        newContents.delete(targetNode.id);

                        if (hasBefore) {
                            const beforeText = new NodeModel({
                                id: nanoid(),
                                type: "spanned",
                                tagName: "span",
                                content: before,
                                parent: root.id,
                                order: nodeOrder,
                            });
                            newContents.set(beforeText.id, beforeText);
                        }

                        if (hasAfter) {
                            const afterText = new NodeModel({
                                id: nanoid(),
                                type: "spanned",
                                content: after,
                                tagName: "span",
                                parent: root.id,
                                order: segIdx + nodeOrder + 0.002,
                            });
                            newContents.set(afterText.id, afterText);
                        }

                        if (selectedText.length > 0) {
                            const newFormatNode = new NodeModel({
                                id: nanoid(),
                                type: "spanned",
                                tagName: formattedTagName,
                                content: selectedText,
                                parent: root.id,
                                order: nodeOrder,
                            });

                            newContents.set(newFormatNode.id, newFormatNode);
                        }
                        return;
                    }

                    if (targetNode.tagName === "span") {

                        const beforeNode = targetNode.clone();
                        beforeNode.content = before;
                        beforeNode.order = nodeOrder + segIdx * 0.001;

                        const afterNode = targetNode.clone();
                        afterNode.content = after;
                        afterNode.order = nodeOrder + 0.02 + segIdx * 0.001;

                        newContents.delete(targetNode.id);
                        if (hasBefore) newContents.set(beforeNode.id, beforeNode);
                        if (hasAfter) newContents.set(afterNode.id, afterNode);

                        if (selectedText.length > 0) {
                            const newFormatNode = new NodeModel({
                                id: nanoid(),
                                type: "spanned",
                                tagName: formattedTagName,
                                content: selectedText,
                                parent: root.id,
                                order: nodeOrder + 0.001 + segIdx * 0.001,
                            });

                            newContents.set(newFormatNode.id, newFormatNode);
                        }
                    } else {
                        console.log("Nexted Formatted", targetNode.dom, before);

                        const wrapper = targetNode.clone();
                        wrapper.content = undefined;

                        const beforeNode = targetNode.clone();
                        beforeNode.content = before;
                        beforeNode.order = nodeOrder + segIdx * 0.001;
                        beforeNode.parent = wrapper.id;

                        const afterNode = targetNode.clone();
                        afterNode.content = after;
                        afterNode.order = nodeOrder + 0.02 + segIdx * 0.001;
                        afterNode.parent = wrapper.id;

                        const newFormatNode = new NodeModel({
                            id: nanoid(),
                            type: "spanned",
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: wrapper.id,
                            order: nodeOrder + 0.001 + segIdx * 0.001,
                        });

                        newContents.set(newFormatNode.id, newFormatNode);
                        newContents.set(wrapper.id, wrapper);

                        newContents.delete(targetNode.id);
                    }
                }
            }

            else {
                // ── REMOVE formatting ──
                if (matchedIdx === -1) return;

                console.log("REMOVVVE")

                const matchedWrapper = chain[matchedIdx];
                const grandParentId = matchedWrapper.parent || root.id;

                // 1. Delete the original target node because we are splitting it
                newContents.delete(targetNode.id);

                // 2. Preserve the text BEFORE the selection (Keep it formatted)
                if (hasBefore) {
                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    newContents.set(beforeNode.id, beforeNode);
                }

                // 3. Preserve the text AFTER the selection (Keep it formatted)
                if (hasAfter) {
                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    // make sure order is slightly higher so it renders after
                    afterNode.order = (targetNode.order || 0) + 0.002;
                    newContents.set(afterNode.id, afterNode);
                }

                // 4. Handle the SELECTED text (Remove the specific format)
                if (selectedText.length > 0) {
                    // If it was ONLY bold, it becomes a span. 
                    // If it was bold AND italic, we need to remove bold but keep italic.
                    // (Assuming you handle deep nesting, you'd recreate the chain minus the matchedWrapper)

                    const unformattedNode = new NodeModel({
                        id: nanoid(),
                        type: "spanned",
                        tagName: "span", // Or the tag of the next parent in the chain
                        content: selectedText,
                        parent: grandParentId, // Attach it outside the removed wrapper
                        order: (targetNode.order || 0) + 0.001,
                    });

                    newContents.set(unformattedNode.id, unformattedNode);
                }
            }
        });

        // // Defensive: jangan dispatch jika semua node hilang
        if (newContents.size === 0) {
            console.warn("Formatting failed: all nodes were purged");
            isFormattingRef.current = false;
            return;
        }

        cleanupEmptyFormatNodes(newContents);
        // mergeAdjacentFormatNodes(newContents);
        disableInteractions(newContents);
        newContents.delete(root.id); // root just for meansurements

        let newContent = undefined;
        if (newContents.size === 1) {
            const contentNode = Array.from(newContents.values())[0];
            if (contentNode.isTextLeaf && contentNode.tagName === "span") {
                newContent = contentNode.content;
                newContents.delete(contentNode.id);
            }
        }

        flushSync(() => {
            dispatch({
                type: "BULK",
                payload: [
                    { type: "SET_NODE_CHILDREN", payload: { id: root.id, children: newContents } }, // add children
                    { type: "UPDATE_NODE", payload: { id: root.id, content: newContent } } // remove plain text
                ]
            });
        });

        // // Restore original selection range
        caretControl.selectionRef.current = { anchor: originalAnchor, focus: originalFocus };
        requestAnimationFrame(() => {
            caretControl.render();
            isFormattingRef.current = false;
        });
    }, []);

    const toggleFormat = useCallback((e: KeyboardEvent, command: "bold" | "italic" | "underline") => {
        e.preventDefault();
        if (isFormattingRef.current) return;
        insertFormattedText(command);
    }, [insertFormattedText]);

    // ═════════════════════════════════════════════════════════════════
    // DELETE (range or single)
    // ═════════════════════════════════════════════════════════════════
    const handleDelete = useCallback((direction: 'backspace' | 'delete'): { anchor: number; focus: number } => {
        const root = rootRef.current;
        const textNodes = getTextNodes();
        const selection = caretControl.selectionRef.current;
        const newContents = new Map(descendantsRef.current);
        let newPos = selection.focus;

        // RANGE
        if (selection.anchor !== selection.focus) {
            const start = Math.min(selection.anchor, selection.focus);
            const end = Math.max(selection.anchor, selection.focus);

            const offsets = textNodes.map((n, i) => ({ node: n, idx: i, start: 0, len: 0 }));
            let p = 0;
            for (let i = 0; i < offsets.length; i++) {
                offsets[i].start = p;
                offsets[i].len = (offsets[i].node.content || "").length;
                p += offsets[i].len;
            }

            const firstIdx = offsets.findIndex(o => end > o.start && start < o.start + o.len);
            const lastIdx = offsets.findLastIndex(o => end > o.start && start < o.start + o.len);

            if (firstIdx !== -1) {
                const first = offsets[firstIdx];
                const last = offsets[lastIdx];
                const firstLocal = Math.max(0, start - first.start);
                const lastLocal = Math.min(last.len, end - last.start);

                if (firstIdx === lastIdx) {
                    const merged = (first.node.content || "").slice(0, firstLocal) + (first.node.content || "").slice(lastLocal);
                    if (merged) {
                        const u = new NodeModel(first.node); u.content = merged;
                        newContents.set(first.node.id, u);
                    } else newContents.delete(first.node.id);
                } else {
                    const merged = (first.node.content || "").slice(0, firstLocal) + (last.node.content || "").slice(lastLocal);
                    if (merged) {
                        const u = new NodeModel(first.node); u.content = merged;
                        newContents.set(first.node.id, u);
                    } else newContents.delete(first.node.id);
                    for (let i = firstIdx + 1; i <= lastIdx; i++) newContents.delete(offsets[i].node.id);
                }
            }
            newPos = start;
        }
        // SINGLE
        else {
            const pos = selection.focus;
            let nodePos = 0, targetIdx = -1, localPos = 0;
            for (let i = 0; i < textNodes.length; i++) {
                const len = (textNodes[i].content || "").length;
                if (pos >= nodePos && pos <= nodePos + len) { targetIdx = i; localPos = pos - nodePos; break; }
                nodePos += len;
            }

            if (targetIdx !== -1) {
                const target = textNodes[targetIdx];
                const content = target.content || "";

                if (direction === 'backspace') {
                    if (localPos > 0) {
                        const txt = content.slice(0, localPos - 1) + content.slice(localPos);
                        if (txt) { const u = new NodeModel(target); u.content = txt; newContents.set(target.id, u); }
                        else newContents.delete(target.id);
                        newPos = pos - 1;
                    } else if (targetIdx > 0) {
                        const prev = textNodes[targetIdx - 1];
                        const u = new NodeModel(prev);
                        u.content = (prev.content || "") + content;
                        newContents.set(prev.id, u);
                        newContents.delete(target.id);
                        newPos = nodePos;
                    }
                } else {
                    if (localPos < content.length) {
                        const txt = content.slice(0, localPos) + content.slice(localPos + 1);
                        if (txt) { const u = new NodeModel(target); u.content = txt; newContents.set(target.id, u); }
                        else newContents.delete(target.id);
                        newPos = pos;
                    } else if (targetIdx < textNodes.length - 1) {
                        const next = textNodes[targetIdx + 1];
                        const u = new NodeModel(target);
                        u.content = content + (next.content || "");
                        newContents.set(target.id, u);
                        newContents.delete(next.id);
                        newPos = pos;
                    }
                }
            }
        }

        normalizeTree(newContents, root.id);
        flushSync(() => {
            dispatch({ type: "SET_NODE_CHILDREN", payload: { id: root.id, children: newContents } });
        });
        return { anchor: newPos, focus: newPos };
    }, [dispatch, getTextNodes, caretControl]);

    // ═════════════════════════════════════════════════════════════════
    // TYPING
    // ═════════════════════════════════════════════════════════════════
    const insertTextAt = useCallback((text: string, at: number): number => {
        const root = rootRef.current;
        const textNodes = getTextNodes();
        const newContents = new Map(descendantsRef.current);
        let globalPos = 0;
        let targetNode: NodeModel | null = null;
        let localOffset = 0;

        for (const n of textNodes) {
            const len = (n.content || "").length;
            if (at >= globalPos && at <= globalPos + len) {
                targetNode = n;
                localOffset = at - globalPos;
                break;
            }
            globalPos += len;
        }
        // console.log(targetNode, textNodes.length);

        if (!targetNode) {
            if (textNodes.length > 0) {
                const last = textNodes[textNodes.length - 1];
                const u = new NodeModel(last);
                u.content = (last.content || "") + text.replace("\s+", "\u200B")
                newContents.set(last.id, u);
            } else {
                const n = new NodeModel({ id: nanoid(), type: "textnode", content: text, parent: root.id });
                newContents.set(n.id, n);
                root.content = text;
                dispatch({
                    type: "UPDATE_NODE",
                    payload: { id: root.id, content: text }
                })
                return at + text.length;
            }
        } else {
            const content = targetNode.content || "";
            const u = new NodeModel(targetNode);
            u.content = content.slice(0, localOffset) + text + content.slice(localOffset);
            newContents.set(targetNode.id, u);
        }

        flushSync(() => {
            dispatch({ type: "SET_NODE_CHILDREN", payload: { id: root.id, children: newContents } });
        });
        return at + text.length;
    }, [dispatch, getTextNodes]);

    const handleBlocking = useCallback((direction: "left" | "right" | "all") => {
        const textNodes = getTextNodes();
        const totalLength = textNodes.reduce((sum, n) => sum + (n.content || "").length, 0);
        const { anchor, focus } = caretControl.selectionRef.current;

        if (direction === "all") {
            caretControl.selectionRef.current = { anchor: 0, focus: totalLength };
            requestAnimationFrame(() => caretControl.render());
            return;
        }

        let newFocus = focus;
        if (direction === "left") {
            newFocus = Math.max(0, focus - 1);
        } else if (direction === "right") {
            newFocus = Math.min(totalLength, focus + 1);
        }

        // Anchor stays fixed (where selection started), focus moves
        caretControl.selectionRef.current = { anchor, focus: newFocus };
        requestAnimationFrame(() => caretControl.render());
    }, [getTextNodes, caretControl]);

    const handleInput = useCallback((e: KeyboardEvent) => {
        // ── Ctrl+A / Cmd+A ──
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
            e.preventDefault();
            return handleBlocking("all");
        }

        // ── Shift+Arrows ──
        if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            e.preventDefault();
            return handleBlocking(e.key === "ArrowLeft" ? "left" : "right");
        }

        // ── Plain arrows (move collapsed caret) ──
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            const textNodes = getTextNodes();
            const totalLength = textNodes.reduce((sum, n) => sum + (n.content || "").length, 0);
            const delta = e.key === "ArrowLeft" ? -1 : 1;
            const newPos = Math.max(0, Math.min(totalLength, caretControl.selectionRef.current.focus + delta));
            caretControl.selectionRef.current = { anchor: newPos, focus: newPos };
            requestAnimationFrame(() => caretControl.render());
            return;
        }

        // ── Existing typing / delete handlers ──
        if (e.key === 'Backspace') {
            e.preventDefault();
            const sel = handleDelete('backspace');
            caretControl.selectionRef.current = sel;
            requestAnimationFrame(() => caretControl.render());
            return;
        }
        if (e.key === 'Delete') {
            e.preventDefault();
            const sel = handleDelete('delete');
            caretControl.selectionRef.current = sel;
            requestAnimationFrame(() => caretControl.render());
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            const { anchor, focus } = caretControl.selectionRef.current;
            const start = Math.min(anchor, focus);
            const end = Math.max(anchor, focus);
            let pos = start;
            if (start !== end) pos = handleDelete('backspace').focus;
            const newPos = insertTextAt('\n', pos);
            caretControl.selectionRef.current = { anchor: newPos, focus: newPos };
            requestAnimationFrame(() => caretControl.render());
            return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            const { anchor, focus } = caretControl.selectionRef.current;
            const start = Math.min(anchor, focus);
            const end = Math.max(anchor, focus);
            let pos = start;
            if (start !== end) pos = handleDelete('backspace').focus;
            const newPos = insertTextAt(e.key, pos);
            caretControl.selectionRef.current = { anchor: newPos, focus: newPos };
            requestAnimationFrame(() => caretControl.render());
            return;
        }
    }, [handleDelete, insertTextAt, handleBlocking, getTextNodes]);

    // ═════════════════════════════════════════════════════════════════
    // SHORTCUTS
    // ═════════════════════════════════════════════════════════════════
    const shortcutHandlers = useMemo<ShortcutHandler[]>(() => [
        { keys: ["Control", "b"], action: (e) => toggleFormat(e, "bold") },
        { keys: ["Meta", "b"], action: (e) => toggleFormat(e, "bold") },
        { keys: ["Control", "i"], action: (e) => toggleFormat(e, "italic") },
        { keys: ["Meta", "i"], action: (e) => toggleFormat(e, "italic") },
        { keys: ["Control", "u"], action: (e) => toggleFormat(e, "underline") },
        { keys: ["Meta", "u"], action: (e) => toggleFormat(e, "underline") },
    ], [toggleFormat]);

    useEffect(() => {
        const root = rootRef.current;
        if (!root.dom) return;
        const win = root.dom.ownerDocument.defaultView;
        if (!win) return;

        win.addEventListener("keydown", handleInput, true);
        const unregister = registerShortcuts(shortcutHandlers, true);

        return () => {
            unregister();
            win.removeEventListener("keydown", handleInput, true);
        };
    }, [handleInput, handleInput]);

    useEffect(() => {

    }, [handleInput]);

    return (
        <Fragment>
            {!Boolean(root.content) ? (
                <Fragment>
                    {nodeChildren.map((node) => (
                        <RenderEditingType
                            key={node.id}
                            node={node} />
                    ))}
                </Fragment>
            ) : root.content}
            <svg
                ref={caretControl.svgRef}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    overflow: "visible",
                    zIndex: 9999,
                }}
            />
        </Fragment>
    );
}