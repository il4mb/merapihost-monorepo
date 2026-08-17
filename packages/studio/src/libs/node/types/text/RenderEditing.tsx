import { useCallback, useMemo, useRef, useEffect, useLayoutEffect, Fragment } from "react";
import { flushSync } from "react-dom";
import { NodeModel, useNodeInternal, useWireEffect } from "@/libs/node";
import RenderEditingType from "./RenderEditingType";
import { getTextNodes } from "./tools";
import { useNodes } from "@/contexts";
import { useNodeDescendants } from "@/hooks";
import { ShortcutHandler, useGlobalKeyListener } from "@/contexts/GlobalKeyListenerProvider";
import { nanoid } from "nanoid";
import { useCaretControl } from "@/hooks/useEditText";
import { TextTypeData } from "./TextType";

type RenderEditingProps = { root: NodeModel<TextTypeData> };

export default function RenderEditing({ root }: RenderEditingProps) {

    const { invokeCommand } = useNodeInternal();
    const { registerShortcuts } = useGlobalKeyListener();
    const { dispatch } = useNodes();

    const descendants = useNodeDescendants(root);
    const nodeChildren = useMemo(() => {
        return Array.from(descendants.values())
            .filter((n) => n.parent === root.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [descendants, root.id]);

    const descendantsRef = useRef<Map<string, NodeModel>>(descendants);
    descendantsRef.current = descendants;

    const caretControl = useCaretControl(root, descendantsRef);
    // const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

    const rootRef = useRef(root);
    useEffect(() => {
        rootRef.current = root;
    }, [root]);

    useWireEffect("renderCaret", () => caretControl.render, [caretControl.render]);
    useWireEffect("getSelection", () => caretControl.selectionRef.current, [])

    // Restore native selection (fallback only)
    // useLayoutEffect(() => {
    //     if (pendingSelectionRef.current && root.dom) {
    //         const { start, end } = pendingSelectionRef.current;
    //         setGlobalCharOffsets(root.dom, start, end);
    //         pendingSelectionRef.current = null;
    //     }
    // }, [nodeChildren, root.dom]);

    const toggleFormat = useCallback((e: KeyboardEvent, command: "bold" | "italic" | "underline") => {
        e.preventDefault();
        invokeCommand(command);
    }, [invokeCommand]);

    // ═════════════════════════════════════════════════════════════════
    // DELETE (range or single)
    // ═════════════════════════════════════════════════════════════════
    const handleDelete = useCallback((direction: 'backspace' | 'delete'): { anchor: number; focus: number } => {
        const root = rootRef.current;
        const textNodes = getTextNodes(descendantsRef.current, rootRef.current);
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

        // normalizeTree(newContents, root.id);
        flushSync(() => {
            dispatch({ type: "SET_NODE_CHILDREN", payload: { id: root.id, children: newContents } });
        });
        return { anchor: newPos, focus: newPos };
    }, [dispatch, caretControl]);

    // ═════════════════════════════════════════════════════════════════
    // TYPING
    // ═════════════════════════════════════════════════════════════════
    const insertTextAt = useCallback((text: string, at: number): number => {
        const root = rootRef.current;
        const textNodes = getTextNodes(descendantsRef.current, rootRef.current);
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
    }, [dispatch]);

    const handleBlocking = useCallback((direction: "left" | "right" | "all") => {
        const textNodes = getTextNodes(descendantsRef.current, rootRef.current);
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
    }, [caretControl]);

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
            const textNodes = getTextNodes(descendantsRef.current, rootRef.current);
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
    }, [handleDelete, insertTextAt, handleBlocking]);

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