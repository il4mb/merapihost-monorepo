import { useCallback, useMemo, useRef, useEffect, useLayoutEffect, Fragment } from "react";
import { flushSync } from "react-dom";
import { NodeModel } from "../..";
import RenderEditingType from "./RenderEditingType";
import { cloneChainSlice, findNode, getAncestorChain, isSameFormatTag, normalizeTree, setGlobalCharOffsets } from "./tools";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { useNodeDescendants } from "@/hooks";
import { ShortcutHandler, useGlobalKeyListener } from "@/contexts/GlobalKeyListenerProvider";
import { nanoid } from "nanoid";
import { getSelectionSegments, useCaretControl } from "@/hooks/useEditText";

type RenderEditingProps = { root: NodeModel };

export default function RenderEditing({ root }: RenderEditingProps) {
    const { registerShortcuts } = useGlobalKeyListener();
    const { dispatch } = useNodesReducer();

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

    // Restore native selection (fallback only)
    useLayoutEffect(() => {
        if (pendingSelectionRef.current && root.dom) {
            const { start, end } = pendingSelectionRef.current;
            setGlobalCharOffsets(root.dom, start, end);
            pendingSelectionRef.current = null;
        }
    }, [nodeChildren, root.dom]);

    const getTextNodes = useCallback(() => {
        return Array.from(descendantsRef.current.values())
            .filter((n) => n.type.name.toLowerCase() === "textnode")
            .sort((a, b) => {
                if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
                const cmp = a.dom.compareDocumentPosition(b.dom);
                if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                return (a.order || 0) - (b.order || 0);
            });
    }, []);

    // ═════════════════════════════════════════════════════════════════
    // FORMATTING
    // ═════════════════════════════════════════════════════════════════
    const insertFormattedText = useCallback((format: "bold" | "italic" | "underline") => {
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

        const segments = getSelectionSegments(selStart, selEnd, newContents);
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
            const originalParentId = targetNode.parent;

            const chain = getAncestorChain(targetNode, newContents, root.id);
            const matchedIdx = chain.findIndex((w) => isSameFormatTag(w.tagName, format));

            if (targetAction === "APPLY") {
                // ── Already formatted → skip entirely ──
                if (matchedIdx !== -1) return;

                // ── Not formatted → wrap selected text ──
                const beforeNode = targetNode.clone();
                beforeNode.content = before;
                beforeNode.order = baseOrder;
                beforeNode.parent = originalParentId;

                const selectedNode = targetNode.clone();
                selectedNode.content = selectedText;
                selectedNode.order = baseOrder + 0.01 + segIdx * 0.001;
                selectedNode.parent = originalParentId;

                const afterNode = targetNode.clone();
                afterNode.content = after;
                afterNode.order = baseOrder + 0.02 + segIdx * 0.001;
                afterNode.parent = originalParentId;

                newContents.delete(targetNode.id);
                if (hasBefore) newContents.set(beforeNode.id, beforeNode);
                if (hasAfter) newContents.set(afterNode.id, afterNode);

                if (selectedText.length > 0) {
                    newContents.set(selectedNode.id, selectedNode);
                    const wrapper = new NodeModel({
                        id: nanoid(),
                        type: "formatnode",
                        tagName: formattedTagName,
                        parent: originalParentId,
                        order: selectedNode.order,
                    });
                    newContents.set(wrapper.id, wrapper);
                    selectedNode.parent = wrapper.id;
                    selectedNode.order = 0;
                }
            } else {
                // ── REMOVE formatting ──
                if (matchedIdx === -1) return;

                const beforeNode = targetNode.clone();
                beforeNode.content = before;
                beforeNode.order = baseOrder;
                beforeNode.parent = originalParentId;

                const selectedNode = targetNode.clone();
                selectedNode.content = selectedText;
                selectedNode.parent = originalParentId;
                selectedNode.order = baseOrder + 0.01 + segIdx * 0.001;

                const afterNode = targetNode.clone();
                afterNode.content = after;
                afterNode.order = baseOrder + 0.02 + segIdx * 0.001;
                afterNode.parent = originalParentId;

                newContents.delete(targetNode.id);
                if (hasBefore) newContents.set(beforeNode.id, beforeNode);
                if (hasAfter) newContents.set(afterNode.id, afterNode);

                if (selectedText.length === 0) return;
                newContents.set(selectedNode.id, selectedNode);

                const matchedWrapper = chain[matchedIdx];
                const grandParentId = matchedWrapper.parent;
                const wrapperOrder = matchedWrapper.order;

                // Clone outer wrappers (if any) to preserve nesting above the removed format
                const selectedSlice = cloneChainSlice(chain, 0, matchedIdx - 1, grandParentId, newContents);
                selectedNode.parent = selectedSlice.innermostId;

                // ── CRITICAL FIX: only adjust order of NEWLY CREATED wrappers ──
                // If outermostId is null, no wrappers were cloned → set selectedNode directly
                if (selectedSlice.outermostId !== null) {
                    const outerNode = findNode(selectedSlice.outermostId, newContents);
                    if (outerNode) {
                        if (hasBefore && hasAfter) {
                            outerNode.order = wrapperOrder + 0.01 + segIdx * 0.001;
                        } else if (hasBefore && !hasAfter) {
                            outerNode.order = wrapperOrder + 0.01 + segIdx * 0.001;
                        } else if (!hasBefore && hasAfter) {
                            outerNode.order = wrapperOrder - 0.01 + segIdx * 0.001;
                        } else {
                            outerNode.order = wrapperOrder + segIdx * 0.001;
                        }
                    }
                } else {
                    // No outer wrappers → place directly under grandparent at wrapper's position
                    if (hasBefore && hasAfter) {
                        selectedNode.order = wrapperOrder + 0.01 + segIdx * 0.001;
                    } else if (hasBefore && !hasAfter) {
                        selectedNode.order = wrapperOrder + 0.01 + segIdx * 0.001;
                    } else if (!hasBefore && hasAfter) {
                        selectedNode.order = wrapperOrder - 0.01 + segIdx * 0.001;
                    } else {
                        selectedNode.order = wrapperOrder + segIdx * 0.001;
                    }
                }

                // Handle afterNode placement if needed
                if (hasAfter) {
                    const afterSlice = cloneChainSlice(chain, 0, matchedIdx, grandParentId, newContents);
                    afterNode.parent = afterSlice.innermostId;
                    if (afterSlice.outermostId !== null) {
                        const outerAfter = findNode(afterSlice.outermostId, newContents);
                        if (outerAfter) {
                            if (hasBefore) {
                                outerAfter.order = wrapperOrder + 0.02 + segIdx * 0.001;
                            } else {
                                outerAfter.order = wrapperOrder + 0.01 + segIdx * 0.001;
                            }
                        }
                    } else {
                        if (hasBefore) {
                            afterNode.order = wrapperOrder + 0.02 + segIdx * 0.001;
                        } else {
                            afterNode.order = wrapperOrder + 0.01 + segIdx * 0.001;
                        }
                    }
                }
            }
        });

        normalizeTree(newContents, root.id);
        flushSync(() => {
            dispatch({ type: "SET_NODE_CHILDREN", payload: { id: root.id, children: newContents } });
        });

        // Restore original selection range
        caretControl.selectionRef.current = { anchor: originalAnchor, focus: originalFocus };
        requestAnimationFrame(() => {
            caretControl.render();
            isFormattingRef.current = false;
        });
    }, [dispatch, root.id, root.dom, caretControl]);

    const toggleFormat = useCallback((e: KeyboardEvent, command: "bold" | "italic" | "underline") => {
        e.preventDefault();
        if (isFormattingRef.current) return;
        insertFormattedText(command);
    }, [insertFormattedText]);

    // ═════════════════════════════════════════════════════════════════
    // DELETE (range or single)
    // ═════════════════════════════════════════════════════════════════
    const handleDelete = useCallback((direction: 'backspace' | 'delete'): { anchor: number; focus: number } => {
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
    }, [dispatch, root.id, getTextNodes, caretControl]);

    // ═════════════════════════════════════════════════════════════════
    // TYPING
    // ═════════════════════════════════════════════════════════════════
    const insertTextAt = useCallback((text: string, at: number): number => {
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

        if (!targetNode) {
            if (textNodes.length > 0) {
                const last = textNodes[textNodes.length - 1];
                const u = new NodeModel(last);
                u.content = (last.content || "") + text;
                newContents.set(last.id, u);
            } else {
                const n = new NodeModel({ id: nanoid(), type: "textnode", content: text, parent: root.id });
                newContents.set(n.id, n);
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
    }, [dispatch, root.id, getTextNodes]);

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
    }, [handleDelete, insertTextAt, caretControl, handleBlocking, getTextNodes]);

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

    const handlersRef = useRef(shortcutHandlers);
    useEffect(() => { handlersRef.current = shortcutHandlers; }, [shortcutHandlers]);

    useEffect(() => {
        if (!root.dom) return;
        const win = root.dom.ownerDocument.defaultView;
        win.addEventListener("keydown", handleInput, true);
        const unregister = registerShortcuts(handlersRef.current, true);

        return () => {
            unregister();
            win.removeEventListener("keydown", handleInput, true);
        };
    }, [root.dom, handleInput, registerShortcuts]);

    return (
        <Fragment>
            {nodeChildren.map((node) => (
                <RenderEditingType key={node.id} node={node} />
            ))}
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