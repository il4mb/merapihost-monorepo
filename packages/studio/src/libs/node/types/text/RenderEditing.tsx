import { useCallback, useMemo, useRef, useEffect, useLayoutEffect, Fragment } from "react";
import { NodeModel } from "../..";
import RenderEditingType from "./RenderEditingType";
import { cloneChainSlice, findNode, getAncestorChain, getFrameContext, getGlobalCharOffsets, getTreeOrderedNodes, isSameFormatTag, normalizeTree, setGlobalCharOffsets } from "./tools";
import { useNodesReducer } from "@/contexts/StudioProvider";
import { useNodeDescendants } from "@/hooks";
import { ShortcutHandler, useGlobalKeyListener } from "@/contexts/GlobalKeyListenerProvider";
import { nanoid } from "nanoid";

type SelectionRange = { start: number; end: number };
type RenderEditingProps = {
    root: NodeModel;
};

export default function RenderEditing({ root }: RenderEditingProps) {
    const { registerShortcuts } = useGlobalKeyListener();
    const { dispatch } = useNodesReducer();
    const pendingSelectionRef = useRef<SelectionRange | null>(null);
    const isFormattingRef = useRef(false);

    const descendants = useNodeDescendants(root);
    const nodeChildren = useMemo(() => {
        return Array.from(descendants.values())
            .filter((n) => n.parent === root.id)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [descendants]);

    // Keep ref synchronously up-to-date with current descendants
    const descendantsRef = useRef<Map<string, NodeModel>>(descendants);
    descendantsRef.current = descendants;

    // Restore text selection after DOM updates caused by node tree changes
    useLayoutEffect(() => {
        if (pendingSelectionRef.current && root.dom) {
            const { start, end } = pendingSelectionRef.current;
            setGlobalCharOffsets(root.dom, start, end);
            pendingSelectionRef.current = null;
        }
    }, [nodeChildren, root.dom]);

    const getRelativeOffsets = useCallback((containerEl: HTMLElement, range: Range, doc: Document) => {
        const fullRange = doc.createRange();
        fullRange.selectNodeContents(containerEl);

        const startRange = doc.createRange();
        startRange.setStart(fullRange.startContainer, fullRange.startOffset);
        if (range.compareBoundaryPoints(Range.START_TO_START, fullRange) < 0) {
            startRange.setEnd(fullRange.startContainer, fullRange.startOffset);
        } else {
            startRange.setEnd(range.startContainer, range.startOffset);
        }
        const startOffset = Math.min(startRange.toString().length, containerEl.textContent?.length || 0);

        const endRange = doc.createRange();
        endRange.setStart(fullRange.startContainer, fullRange.startOffset);
        if (range.compareBoundaryPoints(Range.END_TO_END, fullRange) > 0) {
            endRange.setEnd(fullRange.endContainer, fullRange.endOffset);
        } else {
            endRange.setEnd(range.endContainer, range.endOffset);
        }
        const endOffset = Math.min(endRange.toString().length, containerEl.textContent?.length || 0);

        return {
            startOffset: Math.max(0, startOffset),
            endOffset: Math.max(startOffset, endOffset),
            overlapLength: Math.max(0, endOffset - startOffset),
        };
    }, []);

    const getSelection = useCallback(() => {
        const ctx = getFrameContext(root.dom);
        if (!ctx || !ctx.selection || ctx.selection.rangeCount === 0) return null;

        const range = ctx.selection.getRangeAt(0);
        const doc = ctx.doc;

        const activeNodes: { node: NodeModel; startOffset: number; endOffset: number; overlapLength: number }[] = [];

        descendantsRef.current.forEach((n) => {
            if (n.dom && n.type.name.toLowerCase() === "textnode") {
                if (range.intersectsNode(n.dom)) {
                    const offsets = getRelativeOffsets(n.dom, range, doc);

                    if (offsets.overlapLength > 0 || (range.collapsed && offsets.startOffset >= 0)) {
                        activeNodes.push({
                            node: n,
                            startOffset: offsets.startOffset,
                            endOffset: offsets.endOffset,
                            overlapLength: offsets.overlapLength,
                        });
                    }
                }
            }
        });

        if (activeNodes.length === 0) return null;

        const treeOrdered = getTreeOrderedNodes(root.id, descendantsRef.current);
        const positionMap = new Map<string, number>();
        treeOrdered.forEach((n, idx) => positionMap.set(n.id, idx));

        activeNodes.sort((a, b) => {
            const posA = positionMap.get(a.node.id) ?? 0;
            const posB = positionMap.get(b.node.id) ?? 0;
            return posA - posB;
        });

        return {
            ctx,
            range,
            activeNodes,
        };
    }, [root.dom, root.id, getRelativeOffsets]);


    const insertFormattedText = useCallback((format: "bold" | "italic" | "underline") => {
        if (isFormattingRef.current) return;
        isFormattingRef.current = true;

        const selectionData = getSelection();
        if (!selectionData || !selectionData.ctx || !root.dom) return;

        pendingSelectionRef.current = getGlobalCharOffsets(root.dom, selectionData.range);

        const { activeNodes } = selectionData;
        const formattedTagName = format === "bold" ? "strong" : format === "italic" ? "em" : "u";
        const newContents = new Map(descendantsRef.current);

        const isAllFormatted = activeNodes.every(({ node: targetNode }) => {
            const chain = getAncestorChain(targetNode, newContents, root.id);
            return chain.some((w) => isSameFormatTag(w.tagName, format));
        });
        const targetAction: "APPLY" | "REMOVE" = isAllFormatted ? "REMOVE" : "APPLY";

        // Track format wrappers we touched so we can force-merge them later
        const touchedWrapperIds = new Set<string>();

        activeNodes.forEach(({ node: targetNode, startOffset, endOffset, overlapLength }, nodeIdx) => {
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
                // ── Case A: Node is ALREADY inside the target format ──
                if (matchedIdx !== -1) {
                    if (!hasBefore && !hasAfter) {
                        touchedWrapperIds.add(chain[matchedIdx].id);
                        return;
                    }

                    const parentWrapper = chain[matchedIdx];
                    touchedWrapperIds.add(parentWrapper.id);

                    newContents.delete(targetNode.id);

                    if (hasBefore) {
                        const beforeNode = targetNode.clone();
                        beforeNode.content = before;
                        beforeNode.parent = parentWrapper.id;
                        beforeNode.order = baseOrder - 0.01;
                        newContents.set(beforeNode.id, beforeNode);
                    }
                    if (hasAfter) {
                        const afterNode = targetNode.clone();
                        afterNode.content = after;
                        afterNode.parent = parentWrapper.id;
                        afterNode.order = baseOrder + 0.01;
                        newContents.set(afterNode.id, afterNode);
                    }
                    if (selectedText.length > 0) {
                        const selectedNode = targetNode.clone();
                        selectedNode.content = selectedText;
                        selectedNode.parent = parentWrapper.id;
                        selectedNode.order = baseOrder;
                        newContents.set(selectedNode.id, selectedNode);
                    }
                    return;
                }

                // ── Case B: Node is NOT formatted → create new wrapper ──
                const beforeNode = targetNode.clone();
                beforeNode.content = before;
                beforeNode.order = baseOrder;
                beforeNode.parent = originalParentId;

                const selectedNode = targetNode.clone();
                selectedNode.content = selectedText;
                selectedNode.order = baseOrder + 0.01 + nodeIdx * 0.001;
                selectedNode.parent = originalParentId;

                const afterNode = targetNode.clone();
                afterNode.content = after;
                afterNode.order = baseOrder + 0.02 + nodeIdx * 0.001;
                afterNode.parent = originalParentId;

                newContents.delete(targetNode.id);
                if (hasBefore) newContents.set(beforeNode.id, beforeNode);
                if (hasAfter) newContents.set(afterNode.id, afterNode);

                if (selectedText.length > 0) {
                    newContents.set(selectedNode.id, selectedNode);
                    const newWrapper = new NodeModel({
                        id: nanoid(),
                        type: "formatted",
                        tagName: formattedTagName,
                        parent: originalParentId,
                        order: selectedNode.order,
                    });
                    newContents.set(newWrapper.id, newWrapper);
                    selectedNode.parent = newWrapper.id;
                    selectedNode.order = 0;
                    touchedWrapperIds.add(newWrapper.id);
                }
            } else {
                // ── REMOVE formatting (keep your existing logic) ──
                if (matchedIdx === -1) return;

                const beforeNode = targetNode.clone();
                beforeNode.content = before;
                beforeNode.order = baseOrder;
                beforeNode.parent = originalParentId;

                const selectedNode = targetNode.clone();
                selectedNode.content = selectedText;
                selectedNode.parent = originalParentId;
                selectedNode.order = baseOrder + 0.01 + nodeIdx * 0.001;

                const afterNode = targetNode.clone();
                afterNode.content = after;
                afterNode.order = baseOrder + 0.02 + nodeIdx * 0.001;
                afterNode.parent = originalParentId;

                newContents.delete(targetNode.id);
                if (hasBefore) newContents.set(beforeNode.id, beforeNode);
                if (hasAfter) newContents.set(afterNode.id, afterNode);

                if (selectedText.length === 0) return;
                newContents.set(selectedNode.id, selectedNode);

                const matchedWrapper = chain[matchedIdx];
                const grandParentId = matchedWrapper.parent;
                const wrapperOrder = matchedWrapper.order;

                const selectedSlice = cloneChainSlice(chain, 0, matchedIdx - 1, grandParentId, newContents);
                selectedNode.parent = selectedSlice.innermostId;

                const outerSelectedId = selectedSlice.outermostId ?? selectedSlice.innermostId;
                const outerSelectedNode = findNode(outerSelectedId, newContents);

                if (hasBefore && hasAfter) {
                    const afterSlice = cloneChainSlice(chain, 0, matchedIdx, grandParentId, newContents);
                    afterNode.parent = afterSlice.innermostId;
                    const outerAfterNode = findNode(afterSlice.outermostId as string, newContents);

                    if (outerSelectedNode) outerSelectedNode.order = wrapperOrder + 0.01 + nodeIdx * 0.001;
                    else selectedNode.order = wrapperOrder + 0.01 + nodeIdx * 0.001;

                    if (outerAfterNode) outerAfterNode.order = wrapperOrder + 0.02 + nodeIdx * 0.001;
                } else if (hasBefore && !hasAfter) {
                    if (outerSelectedNode) outerSelectedNode.order = wrapperOrder + 0.01 + nodeIdx * 0.001;
                    else selectedNode.order = wrapperOrder + 0.01 + nodeIdx * 0.001;
                } else if (!hasBefore && hasAfter) {
                    if (outerSelectedNode) outerSelectedNode.order = wrapperOrder - 0.01 + nodeIdx * 0.001;
                    else selectedNode.order = wrapperOrder - 0.01 + nodeIdx * 0.001;
                } else {
                    if (outerSelectedNode) outerSelectedNode.order = wrapperOrder + nodeIdx * 0.001;
                    else selectedNode.order = wrapperOrder + nodeIdx * 0.001;
                }
            }
        });

        normalizeTree(newContents, root.id);
        dispatch({ type: "SET_NODE_CHILDREN", payload: { id: root.id, children: newContents } });
        setTimeout(() => { isFormattingRef.current = false; }, 50);
    }, [getSelection, dispatch, root.id, root.dom]);


    const toggleFormat = useCallback((e: KeyboardEvent, command: "bold" | "italic" | "underline") => {
        e.preventDefault();
        if (isFormattingRef.current) return;
        insertFormattedText(command);
    }, [insertFormattedText]);

    const shortcutHandlers = useMemo<ShortcutHandler[]>(
        () => [
            { keys: ["Control", "b"], action: (e) => toggleFormat(e, "bold") },
            { keys: ["Meta", "b"], action: (e) => toggleFormat(e, "bold") },
            { keys: ["Control", "i"], action: (e) => toggleFormat(e, "italic") },
            { keys: ["Meta", "i"], action: (e) => toggleFormat(e, "italic") },
            { keys: ["Control", "u"], action: (e) => toggleFormat(e, "underline") },
            { keys: ["Meta", "u"], action: (e) => toggleFormat(e, "underline") }
        ],
        [toggleFormat]
    );
    const handlersRef = useRef(shortcutHandlers);
    useEffect(() => {
        handlersRef.current = shortcutHandlers;
    }, [shortcutHandlers]);

    useEffect(() => {
        const unregister = registerShortcuts(handlersRef.current, true);
        return () => {
            unregister();
        }
    }, []);

    return (
        <Fragment>
            {nodeChildren.map((node) => (
                <RenderEditingType
                    key={node.id}
                    node={node} />
            ))}
        </Fragment>
    );
}