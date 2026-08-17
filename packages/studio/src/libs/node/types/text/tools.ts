import { nanoid } from "nanoid";
import { findNode, getNodeAncestorChain, NodeModel } from "../..";
import { TextTypeData } from "./TextType";

// export const getFrameContext = (dom: HTMLElement | null) => {
//     const el = dom;
//     if (!el) return null;
//     const doc = el.ownerDocument;
//     const win = doc.defaultView;
//     if (!win) return null;
//     const selection = win.getSelection();
//     return { el, doc, win, selection };
// }

// Helper to check equivalent formatting tags (e.g. <b> and <strong>)


// // Calculate absolute character offsets relative to container text
// export const getGlobalCharOffsets = (containerEl: HTMLElement, range: Range) => {
//     const doc = containerEl.ownerDocument;
//     const startRange = doc.createRange();
//     startRange.selectNodeContents(containerEl);
//     startRange.setEnd(range.startContainer, range.startOffset);
//     const start = startRange.toString().length;

//     const endRange = doc.createRange();
//     endRange.selectNodeContents(containerEl);
//     endRange.setEnd(range.endContainer, range.endOffset);
//     const end = endRange.toString().length;

//     return { start, end };
// };

// // Restore DOM range from absolute character offsets
// export const setGlobalCharOffsets = (containerEl: HTMLElement, start: number, end: number) => {
//     const doc = containerEl.ownerDocument;
//     const win = doc.defaultView;
//     if (!win) return;
//     const selection = win.getSelection();
//     if (!selection) return;

//     let currentPos = 0;
//     let startNode: Node | null = null;
//     let startOffset = 0;
//     let endNode: Node | null = null;
//     let endOffset = 0;

//     const walker = doc.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null);
//     let currentNode = walker.nextNode();

//     while (currentNode) {
//         const textLen = currentNode.nodeValue?.length || 0;

//         if (!startNode && currentPos + textLen >= start) {
//             startNode = currentNode;
//             startOffset = start - currentPos;
//         }
//         if (!endNode && currentPos + textLen >= end) {
//             endNode = currentNode;
//             endOffset = end - currentPos;
//             break;
//         }

//         currentPos += textLen;
//         currentNode = walker.nextNode();
//     }

//     if (startNode && endNode) {
//         const newRange = doc.createRange();
//         newRange.setStart(startNode, Math.min(startOffset, startNode.nodeValue?.length || 0));
//         newRange.setEnd(endNode, Math.min(endOffset, endNode.nodeValue?.length || 0));

//         selection.removeAllRanges();
//         selection.addRange(newRange);
//     }
// };

// // Depth-First Search (DFS) traversal in strict document tree order
// export const getTreeOrderedNodes = (rootId: string, map: Map<string, NodeModel>): NodeModel[] => {
//     const result: NodeModel[] = [];
//     const traverse = (parentId: string) => {
//         const children = Array.from(map.values())
//             .filter((n) => n.parent === parentId)
//             .sort((a, b) => {
//                 const diff = (a.order || 0) - (b.order || 0);
//                 return diff !== 0 ? diff : a.id.localeCompare(b.id);
//             });

//         for (const child of children) {
//             result.push(child);
//             traverse(child.id);
//         }
//     };
//     traverse(rootId);
//     return result;
// };


// /**
//  * Looking Upward Chain
//  */
// export const getAncestorChain = (startNode: NodeModel, map: Map<string, NodeModel>, rootId: string): NodeModel[] => {
//     const chain: NodeModel[] = [];
//     // check start node first
//     let current = findNode(startNode.id, map);
//     while (current && current.id !== rootId) {
//         chain.push(current);
//         current = findNode(current.parent, map);
//     }
//     return chain;
// };

// Clone a slice of wrapper chain (index start..end, inclusive) from OUTER to INNER
export function cloneChainSlice(chain: NodeModel[], start: number, end: number, outerParentId: string | null, map: Map<string, NodeModel>) {
    if (start > end) {
        return { innermostId: outerParentId as string, outermostId: null };
    }
    let parentId = outerParentId;
    let outermostId: string | null = null;
    for (let i = end; i >= start; i--) {
        const c = chain[i].clone();
        c.parent = parentId;
        c.order = 0;
        map.set(c.id, c);
        if (outermostId === null) outermostId = c.id;
        parentId = c.id;
    }
    return { innermostId: parentId as string, outermostId };
}

// export const normalizeOrders = (map: Map<string, NodeModel>, rootId: string) => {

//     const normalize = (parentId: string) => {
//         const children = Array.from(map.values())
//             .filter((n) => n.parent === parentId)
//             .sort((a, b) => (a.order || 0) - (b.order || 0));

//         children.forEach((child, index) => {
//             child.order = index;
//             normalize(child.id);
//         });
//     };

//     normalize(rootId);
// }


// export const normalizeTree = (map: Map<string, NodeModel>, rootId: string) => {
//     purgeOrphanNodes(map, rootId);
//     mergeAdjacentFormatNodes(map);
//     // cleanupEmptyFormatNodes(map);
//     normalizeOrders(map, rootId);
//     disableInteractions(map);
// };


// ==================================================================================


const isSameFormatTag = (tagName: string, format: "bold" | "italic" | "underline") => {
    const t = tagName.toLowerCase();
    if (format === "bold") return t === "strong" || t === "b";
    if (format === "italic") return t === "em" || t === "i";
    if (format === "underline") return t === "u";
    return false;
};


const isEmptyContent = (node: NodeModel, map: Map<string, NodeModel>): boolean => {
    const children = Array.from(map.values()).filter((n) => n.parent === node.id);
    if (children.length > 0) {
        return children.every((child) => isEmptyContent(child, map));
    } else {
        return !Boolean(node.content); // empty|null|undefineded|false
    }
}

const isMergeable = (node: NodeModel) => {
    return node.type.name === "spanned" || Boolean(node.content);
}

const areMergeableFormatTags = (a: string, b: string): boolean => {
    const ta = a.toLowerCase();
    const tb = b.toLowerCase();
    if (ta === tb) return true; // span===span, div===div, etc.
    if ((ta === "b" || ta === "strong") && (tb === "b" || tb === "strong")) return true;
    if ((ta === "i" || ta === "em") && (tb === "i" || tb === "em")) return true;
    if (ta === "u" && tb === "u") return true;
    return false;
};

const mergeAdjacentFormatNodes = (descendants: Map<string, NodeModel>) => {
    let changed = true;
    while (changed) {
        changed = false;
        const parentGroups = new Map<string, NodeModel[]>();

        descendants.forEach((n) => {
            if (n.parent) {
                const group = parentGroups.get(n.parent) || [];
                group.push(n);
                parentGroups.set(n.parent, group);
            }
        });

        parentGroups.forEach((children) => {
            children.sort((a, b) => (a.order || 0) - (b.order || 0));
            for (let i = 0; i < children.length - 1; i++) {
                const curr = children[i];
                const next = children[i + 1];

                const bothFormatNode = isMergeable(curr) && isMergeable(next);
                if (bothFormatNode && areMergeableFormatTags(curr.tagName, next.tagName)) {
                    const merged = new NodeModel(curr);
                    merged.content = (merged.content || "") + (next.content || "");
                    descendants.set(curr.id, merged);
                    descendants.delete(next.id);
                    changed = true;
                    break;
                }
            }
        });
    }
};

const cleanupEmptyFormatNodes = (descendants: Map<string, NodeModel>) => {
    let changed = true;
    while (changed) {
        changed = false;
        const emptyFormatNodes = Array.from(descendants.values()).filter((n) => isEmptyContent(n, descendants));
        for (const node of emptyFormatNodes) {
            descendants.delete(node.id);
            changed = true;
        }
    }
};

const disableInteractions = (descendants: Map<string, NodeModel>) => {
    descendants.forEach(node => {
        node.selectable = false;
        node.hoverable = false;
    });
}

const getSelectionSegments = (anchor: number, focus: number, descendants: Map<string, NodeModel>, rootNode: NodeModel): SelectionSegment[] => {
    const start = Math.min(anchor, focus);
    const end = Math.max(anchor, focus);
    if (start === end) return [];

    const textNodes = getTextNodes(descendants, rootNode);
    const segments: SelectionSegment[] = [];
    let globalPos = 0;

    for (const node of textNodes) {
        const len = (node.content || "").length;
        const nodeStart = globalPos;
        const nodeEnd = globalPos + len;

        if (end <= nodeStart || start >= nodeEnd) {
            globalPos += len;
            continue;
        }

        const segStart = Math.max(start, nodeStart);
        const segEnd = Math.min(end, nodeEnd);
        const localStart = segStart - nodeStart;
        const localEnd = segEnd - nodeStart;

        segments.push({
            node,
            globalStart: segStart,
            globalEnd: segEnd,
            localStart,
            localEnd,
            isFull: localStart === 0 && localEnd === len,
            isPartial: localStart > 0 || localEnd < len,
        });

        globalPos += len;
    }
    return segments;
};

export type SelectionSegment = {
    node: NodeModel;
    globalStart: number;
    globalEnd: number;
    localStart: number;
    localEnd: number;
    isFull: boolean;
    isPartial: boolean;
};

/** Ambil semua text leaf dalam urutan dokumen */
export const getTextNodes = (descendants: Map<string, NodeModel>, rootNode: NodeModel): NodeModel[] => {
    // Jika root sendiri yang punya content string (plain text, no descendants)
    if (rootNode.isTextLeaf) return [rootNode];

    return Array.from(descendants.values())
        .filter(n => n.isTextLeaf)
        .sort((a, b) => {
            if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
            const cmp = a.dom.compareDocumentPosition(b.dom);
            if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return (a.order || 0) - (b.order || 0);
        });
};

export type FormattedType = "bold" | "italic" | "underline";
export type Selection = { anchor: number, focus: number };
export type ApplyFormattedProps = {
    format: FormattedType;
    descendants: Map<string, NodeModel>;
    selection: Selection;
    node: NodeModel<TextTypeData>;
}
export const applyFormatted = ({ format, node: textNode, selection, descendants }: ApplyFormattedProps) => {

    if (selection.anchor === selection.focus) return;

    // Preserve original selection range
    const originalAnchor = selection.anchor;
    const originalFocus = selection.focus;
    const selStart = Math.min(originalAnchor, originalFocus);
    const selEnd = Math.max(originalAnchor, originalFocus);

    const formattedTagName = format === "bold" ? "strong" : format === "italic" ? "em" : "u";

    const contents = new Map(descendants);
    contents.set(textNode.id, textNode); // ensure root 

    const segments = getSelectionSegments(selStart, selEnd, contents, textNode);
    if (segments.length === 0) return;


    const isAllFormatted = segments.every((seg) => {
        const chain = getNodeAncestorChain(seg.node.id, textNode.id, contents);
        return chain.some((w) => isSameFormatTag(w.tagName, format));
    });
    const targetAction: "APPLY" | "REMOVE" = isAllFormatted ? "REMOVE" : "APPLY";

    segments.forEach((seg, segIdx) => {

        const targetNode = seg.node;
        const targetIsRoot = targetNode.id === textNode.id;

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
        const originalParentId = targetIsRoot ? textNode.id : targetNode.parent;

        const chain = getNodeAncestorChain(targetNode.id, textNode.id, contents);
        const matchedIdx = chain.findIndex((w) => isSameFormatTag(w.tagName, format));

        if (targetAction === "APPLY") {
            if (matchedIdx !== -1) return;

            const nodeOrder = targetNode.order || 0;
            const grandParentId = targetNode.parent || textNode.id;
            const isTargetFormatted = targetNode.type.name.toLowerCase() === "spanned";
            const isFormatTargetEqual = isSameFormatTag(targetNode.tagName, format);

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

                contents.delete(targetNode.id);
                if (hasBefore) contents.set(beforeNode.id, beforeNode);
                if (hasAfter) contents.set(afterNode.id, afterNode);

                if (selectedText.length > 0) {
                    if (chain.length > 0) {
                        // ── Ada ancestor spanned → clone & preserve ──
                        const { innermostId, outermostId } = cloneChainSlice(
                            chain, 0, chain.length - 1, originalParentId, contents
                        );

                        // Promote cloned wrappers: hapus content supaya jadi container
                        let cleanId = outermostId;
                        while (cleanId) {
                            const n = findNode(cleanId, contents);
                            if (!n) break;
                            n.content = undefined;
                            const kids = Array.from(contents.values()).filter(c => c.parent === cleanId);
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

                        contents.set(newFormatNode.id, newFormatNode);

                        if (outermostId) {
                            const outerNode = findNode(outermostId, contents);
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
                        contents.set(wrapper.id, wrapper);
                    }
                }
            }

            if (isTargetFormatted) {

                if (isFormatTargetEqual) {
                    contents.delete(targetNode.id);

                    if (hasBefore) {
                        const beforeText = new NodeModel({
                            id: nanoid(),
                            type: "spanned",
                            tagName: "span",
                            content: before,
                            parent: textNode.id,
                            order: nodeOrder,
                        });
                        contents.set(beforeText.id, beforeText);
                    }

                    if (hasAfter) {
                        const afterText = new NodeModel({
                            id: nanoid(),
                            type: "spanned",
                            content: after,
                            tagName: "span",
                            parent: textNode.id,
                            order: segIdx + nodeOrder + 0.002,
                        });
                        contents.set(afterText.id, afterText);
                    }

                    if (selectedText.length > 0) {
                        const newFormatNode = new NodeModel({
                            id: nanoid(),
                            type: "spanned",
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: textNode.id,
                            order: nodeOrder,
                        });

                        contents.set(newFormatNode.id, newFormatNode);
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

                    contents.delete(targetNode.id);
                    if (hasBefore) contents.set(beforeNode.id, beforeNode);
                    if (hasAfter) contents.set(afterNode.id, afterNode);

                    if (selectedText.length > 0) {
                        const newFormatNode = new NodeModel({
                            id: nanoid(),
                            type: "spanned",
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: textNode.id,
                            order: nodeOrder + 0.001 + segIdx * 0.001,
                        });

                        contents.set(newFormatNode.id, newFormatNode);
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

                    contents.set(newFormatNode.id, newFormatNode);
                    contents.set(wrapper.id, wrapper);

                    contents.delete(targetNode.id);
                }
            }
        }

        else {
            // ── REMOVE formatting ──
            if (matchedIdx === -1) return;

            console.log("REMOVVVE")

            const matchedWrapper = chain[matchedIdx];
            const grandParentId = matchedWrapper.parent || textNode.id;

            // 1. Delete the original target node because we are splitting it
            contents.delete(targetNode.id);

            // 2. Preserve the text BEFORE the selection (Keep it formatted)
            if (hasBefore) {
                const beforeNode = targetNode.clone();
                beforeNode.content = before;
                contents.set(beforeNode.id, beforeNode);
            }

            // 3. Preserve the text AFTER the selection (Keep it formatted)
            if (hasAfter) {
                const afterNode = targetNode.clone();
                afterNode.content = after;
                // make sure order is slightly higher so it renders after
                afterNode.order = (targetNode.order || 0) + 0.002;
                contents.set(afterNode.id, afterNode);
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

                contents.set(unformattedNode.id, unformattedNode);
            }
        }
    });

    // Defensive: jangan dispatch jika semua node hilang
    if (contents.size === 0) {
        console.warn("Formatting failed: all nodes were purged");
        return;
    }

    cleanupEmptyFormatNodes(contents);
    mergeAdjacentFormatNodes(contents);
    disableInteractions(contents);
    contents.delete(textNode.id); // root just for meansurements

    return contents;
}