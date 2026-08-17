import { nanoid } from "nanoid";
import { findNode, getNodeAncestorChain, NodeModel, normalizeNodeOrders } from "../..";
import { TextTypeData } from "./TextType";

// ---------------------------------------------------------------------------
// Order-spacing constants
// ---------------------------------------------------------------------------
// NodeModel.order values are floats. These small increments let a newly
// split/inserted sibling slot in between existing nodes without a full
// re-normalization on every insert (normalizeNodeOrders() runs once at the
// end instead). The exact magnitudes below are copied 1:1 from the values
// used throughout the original implementation — do not change them without
// re-checking every call site, since normalizeNodeOrders() only guarantees
// correct *relative* ordering, not correct *values*.
const ORDER_EPS = 0.001; // smallest increment, usually multiplied by segIdx
const ORDER_MINOR = 0.01; // "before"-style offset
const ORDER_MAJOR = 0.02; // "after"-style offset
const ORDER_STEP = 0.002; // "after" offset used in the REMOVE branch

// Safety cap for the various `while (changed) { ... }` fixed-point loops
// below. None of them should ever need this many passes for real documents;
// it exists purely so a future bug (e.g. a merge condition that never
// stabilizes) degrades into a console warning instead of hanging the tab.
const MAX_FIXPOINT_ITERATIONS = 5000;

/**
 * Clone a slice of a wrapper chain (index start..end, inclusive), from
 * OUTER to INNER, re-parenting the clones under `outerParentId`.
 *
 * Returns:
 *  - innermostId: id of the innermost clone (or `outerParentId` if the
 *    slice is empty, i.e. start > end)
 *  - outermostId: id of the outermost clone, or null if the slice is empty
 */
export function cloneChainSlice(
    chain: NodeModel[],
    start: number,
    end: number,
    outerParentId: string | null,
    map: Map<string, NodeModel>
): { innermostId: string; outermostId: string | null } {
    if (start > end) {
        // Empty slice: nothing to clone, "innermost" collapses to the parent.
        return { innermostId: outerParentId as string, outermostId: null };
    }

    let parentId: string | null = outerParentId;
    let outermostId: string | null = null;

    for (let i = end; i >= start; i--) {
        const clone = chain[i].clone();
        clone.parent = parentId;
        clone.order = 0;
        map.set(clone.id, clone);
        if (outermostId === null) outermostId = clone.id;
        parentId = clone.id;
    }

    // Loop ran at least once (start <= end), so parentId was reassigned to a
    // real clone id and is guaranteed non-null here.
    return { innermostId: parentId as string, outermostId };
}

// ---------------------------------------------------------------------------
// Small node-construction helper
// ---------------------------------------------------------------------------
// Used for every place that builds a *brand new* "spanned" node from scratch
// (as opposed to `.clone()`-ing an existing node, which intentionally
// preserves the source node's other properties and is left untouched below).
function makeSpannedNode(params: {
    tagName: string;
    content?: string;
    parent: string | null;
    order: number;
}): NodeModel {
    return new NodeModel({
        id: nanoid(),
        type: "spanned",
        tagName: params.tagName,
        content: params.content,
        parent: params.parent,
        order: params.order,
    });
}

const isSameFormatTag = (tagName: string, format: FormattedType): boolean => {
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
    }
    return !Boolean(node.content); // empty | null | undefined | false
};

const isMergeable = (node: NodeModel): boolean => node.type.isText;

/** True if `content` is present and consists only of whitespace. */
const isWhitespaceOnly = (content: string | undefined): boolean => {
    return Boolean(content) && /^\s*$/.test(content || "");
};

const areMergeableFormatTags = (a: string, b: string): boolean => {
    const ta = a.toLowerCase();
    const tb = b.toLowerCase();
    if (ta === tb) return true; // span===span, div===div, etc.
    if ((ta === "b" || ta === "strong") && (tb === "b" || tb === "strong")) return true;
    if ((ta === "i" || ta === "em") && (tb === "i" || tb === "em")) return true;
    if (ta === "u" && tb === "u") return true;
    return false;
};

/** Two nodes can merge if mergeable, same format tag family, siblings, and
 *  adjacent (optionally with only whitespace-only nodes between them). */
const canMergeAcrossWhitespace = (
    node1: NodeModel,
    node2: NodeModel,
    descendants: Map<string, NodeModel>
): boolean => {
    if (!isMergeable(node1) || !isMergeable(node2)) return false;
    if (!areMergeableFormatTags(node1.tagName, node2.tagName)) return false;
    if (node1.parent !== node2.parent) return false;

    const siblings = Array.from(descendants.values())
        .filter((n) => n.parent === node1.parent)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const idx1 = siblings.findIndex((n) => n.id === node1.id);
    const idx2 = siblings.findIndex((n) => n.id === node2.id);

    if (Math.abs(idx1 - idx2) === 1) return true;

    const minIdx = Math.min(idx1, idx2);
    const maxIdx = Math.max(idx1, idx2);

    for (let i = minIdx + 1; i < maxIdx; i++) {
        const between = siblings[i];
        if (!isWhitespaceOnly(between.content) || between.type.isText === false) {
            return false;
        }
    }

    return true;
};

/** Runs a `while (changed)` fix-point loop with a safety cap so a stray bug
 *  in the merge condition can't hang the tab — it just stops and warns. */
function runFixpoint(label: string, step: () => boolean): void {
    let changed = true;
    let iterations = 0;
    while (changed) {
        if (++iterations > MAX_FIXPOINT_ITERATIONS) {
            console.warn(`${label}: exceeded ${MAX_FIXPOINT_ITERATIONS} iterations, aborting to avoid a hang.`);
            break;
        }
        changed = step();
    }
}

const mergeAdjacentFormatNodesWithWhitespace = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("mergeAdjacentFormatNodesWithWhitespace", () => {
        const parentGroups = new Map<string, NodeModel[]>();
        descendants.forEach((node) => {
            if (node.parent) {
                const group = parentGroups.get(node.parent) || [];
                group.push(node);
                parentGroups.set(node.parent, group);
            }
        });

        for (const children of parentGroups.values()) {
            children.sort((a, b) => (a.order || 0) - (b.order || 0));

            for (let i = 0; i < children.length - 1; i++) {
                const current = children[i];
                const next = children[i + 1];

                if (
                    canMergeAcrossWhitespace(current, next, descendants) &&
                    isMergeable(current) &&
                    isMergeable(next) &&
                    areMergeableFormatTags(current.tagName, next.tagName)
                ) {
                    const merged = new NodeModel(current);
                    merged.content = (merged.content || "") + (next.content || "");
                    descendants.set(current.id, merged);
                    descendants.delete(next.id);
                    return true;
                }

                if (i < children.length - 2) {
                    const afterNext = children[i + 2];
                    if (
                        isWhitespaceOnly(next.content) &&
                        canMergeAcrossWhitespace(current, afterNext, descendants) &&
                        isMergeable(current) &&
                        isMergeable(afterNext) &&
                        areMergeableFormatTags(current.tagName, afterNext.tagName)
                    ) {
                        const merged = new NodeModel(current);
                        merged.content = (merged.content || "") + (next.content || "") + (afterNext.content || "");
                        descendants.set(current.id, merged);
                        descendants.delete(next.id);
                        descendants.delete(afterNext.id);
                        return true;
                    }
                }
            }
        }
        return false;
    });
};

const mergeAdjacentFormatNodes = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("mergeAdjacentFormatNodes", () => {
        const parentGroups = new Map<string, NodeModel[]>();
        descendants.forEach((n) => {
            if (n.parent) {
                const group = parentGroups.get(n.parent) || [];
                group.push(n);
                parentGroups.set(n.parent, group);
            }
        });

        for (const children of parentGroups.values()) {
            children.sort((a, b) => (a.order || 0) - (b.order || 0));
            for (let i = 0; i < children.length - 1; i++) {
                const curr = children[i];
                const next = children[i + 1];
                if (isMergeable(curr) && isMergeable(next) && areMergeableFormatTags(curr.tagName, next.tagName)) {
                    const merged = new NodeModel(curr);
                    merged.content = (merged.content || "") + (next.content || "");
                    descendants.set(curr.id, merged);
                    descendants.delete(next.id);
                    return true;
                }
            }
        }
        return false;
    });
};

const mergeNestedFormatNodes = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("mergeNestedFormatNodes", () => {
        for (const node of descendants.values()) {
            if (!isMergeable(node)) continue;

            const children = Array.from(descendants.values())
                .filter((n) => n.parent === node.id)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            // Only flatten a single-child wrapper.
            if (children.length !== 1) continue;

            const nested = children[0];
            if (!isMergeable(nested) || !areMergeableFormatTags(node.tagName, nested.tagName)) continue;

            // Move nested's children directly under `node`.
            const grandchildren = Array.from(descendants.values()).filter((n) => n.parent === nested.id);
            for (const grandchild of grandchildren) {
                grandchild.parent = node.id;
            }

            if (nested.content) {
                node.content = (node.content ?? "") + nested.content;
            }

            descendants.delete(nested.id);
            return true;
        }
        return false;
    });
};

const cleanupEmptyFormatNodes = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("cleanupEmptyFormatNodes", () => {
        const empties = Array.from(descendants.values()).filter((n) => isEmptyContent(n, descendants));
        for (const node of empties) {
            descendants.delete(node.id);
        }
        return empties.length > 0;
    });
};

const disableInteractions = (descendants: Map<string, NodeModel>): void => {
    descendants.forEach((node) => {
        node.selectable = false;
        node.hoverable = false;
    });
};

const getSelectionSegments = (
    anchor: number,
    focus: number,
    descendants: Map<string, NodeModel>,
    rootNode: NodeModel
): SelectionSegment[] => {
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
    if (rootNode.content) return [rootNode];

    return Array.from(descendants.values())
        .filter((n) => n.content)
        .sort((a, b) => {
            if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
            const cmp = a.dom.compareDocumentPosition(b.dom);
            if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return (a.order || 0) - (b.order || 0);
        });
};

export type FormattedType = "bold" | "italic" | "underline";
export type Selection = { anchor: number; focus: number };
export type ApplyFormattedProps = {
    format: FormattedType;
    descendants: Map<string, NodeModel>;
    selection: Selection;
    node: NodeModel<TextTypeData>;
};

/**
 * Core implementation. Kept separate from the exported `applyFormatted` so
 * the export can wrap it in a try/catch (see below) without indenting this
 * whole function body.
 */
function applyFormattedInternal({
    format,
    node: rootNode,
    selection,
    descendants,
}: ApplyFormattedProps): Map<string, NodeModel> | undefined {
    if (selection.anchor === selection.focus) return undefined;

    const originalAnchor = selection.anchor;
    const originalFocus = selection.focus;
    const selStart = Math.min(originalAnchor, originalFocus);
    const selEnd = Math.max(originalAnchor, originalFocus);

    const formattedTagName = format === "bold" ? "strong" : format === "italic" ? "em" : "u";

    const contents = new Map(descendants);
    contents.set(rootNode.id, rootNode); // ensure root is present for chain lookups

    const segments = getSelectionSegments(selStart, selEnd, contents, rootNode);
    if (segments.length === 0) return undefined;

    const isAllFormatted = segments.every((seg) => {
        const chain = getNodeAncestorChain(seg.node.id, rootNode.id, contents);
        return chain.some((w) => isSameFormatTag(w.tagName, format));
    });
    const targetAction: "APPLY" | "REMOVE" = isAllFormatted ? "REMOVE" : "APPLY";

    segments.forEach((seg, segIdx) => {
        const targetNode = seg.node;
        const targetIsRoot = targetNode.id === rootNode.id;

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
        const originalParentId = targetIsRoot ? rootNode.id : targetNode.parent;

        const nodeOrder = targetNode.order || 0;
        const isTargetFormatted = targetNode.type.name.toLowerCase() === "spanned";
        const isFormatTargetEqual = isSameFormatTag(targetNode.tagName, format);

        const chain = getNodeAncestorChain(targetNode.id, rootNode.id, contents);
        const matchedIdx = chain.findIndex((w) => isSameFormatTag(w.tagName, format));

        if (targetAction === "APPLY") {
            if (matchedIdx !== -1) return;

            if (targetIsRoot) {
                const beforeNode = makeSpannedNode({
                    tagName: "span",
                    content: before,
                    order: baseOrder,
                    parent: originalParentId,
                });
                const afterNode = makeSpannedNode({
                    tagName: "span",
                    content: after,
                    order: baseOrder + ORDER_MAJOR + segIdx * ORDER_EPS,
                    parent: originalParentId,
                });

                contents.delete(targetNode.id);
                if (hasBefore) contents.set(beforeNode.id, beforeNode);
                if (hasAfter) contents.set(afterNode.id, afterNode);

                if (selectedText.length > 0) {
                    if (chain.length > 0) {
                        // Ancestor spanned wrapper(s) exist → clone & preserve them.
                        const { innermostId, outermostId } = cloneChainSlice(
                            chain,
                            0,
                            chain.length - 1,
                            originalParentId,
                            contents
                        );

                        // Promote cloned wrappers: strip content so they act as
                        // pure containers rather than duplicating text.
                        let cleanId = outermostId;
                        let guard = 0;
                        while (cleanId && guard++ < MAX_FIXPOINT_ITERATIONS) {
                            const n = findNode(cleanId, contents);
                            if (!n) break;
                            n.content = undefined;
                            const kids = Array.from(contents.values()).filter((c) => c.parent === cleanId);
                            cleanId = kids.length > 0 ? kids[0].id : null;
                        }

                        // New format node as a leaf inside the innermost clone.
                        const newFormatNode = makeSpannedNode({
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: innermostId,
                            order: 0,
                        });
                        contents.set(newFormatNode.id, newFormatNode);

                        if (outermostId) {
                            const outerNode = findNode(outermostId, contents);
                            if (outerNode) {
                                outerNode.order = baseOrder + ORDER_MINOR + segIdx * ORDER_EPS;
                            }
                        }
                    } else {
                        // No ancestor wrapper → simple spanned leaf.
                        const wrapper = makeSpannedNode({
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: originalParentId,
                            order: baseOrder + ORDER_MINOR + segIdx * ORDER_EPS,
                        });
                        contents.set(wrapper.id, wrapper);
                    }
                }
            }

            if (isTargetFormatted) {
                if (isFormatTargetEqual) {
                    contents.delete(targetNode.id);

                    if (hasBefore) {
                        const beforeText = makeSpannedNode({
                            tagName: "span",
                            content: before,
                            parent: rootNode.id,
                            order: nodeOrder,
                        });
                        contents.set(beforeText.id, beforeText);
                    }

                    if (hasAfter) {
                        const afterText = makeSpannedNode({
                            tagName: "span",
                            content: after,
                            parent: rootNode.id,
                            order: segIdx + nodeOrder + ORDER_STEP,
                        });
                        contents.set(afterText.id, afterText);
                    }

                    if (selectedText.length > 0) {
                        const newFormatNode = makeSpannedNode({
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: rootNode.id,
                            order: nodeOrder,
                        });
                        contents.set(newFormatNode.id, newFormatNode);
                    }
                    return;
                }

                if (targetNode.tagName === "span") {
                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    beforeNode.order = nodeOrder + segIdx * ORDER_EPS;

                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    afterNode.order = nodeOrder + ORDER_MAJOR + segIdx * ORDER_EPS;

                    if (hasBefore) contents.set(beforeNode.id, beforeNode);
                    if (hasAfter) contents.set(afterNode.id, afterNode);

                    if (selectedText.length > 0) {
                        const newFormatNode = makeSpannedNode({
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: rootNode.id,
                            order: nodeOrder + ORDER_EPS + segIdx * ORDER_EPS,
                        });
                        contents.set(newFormatNode.id, newFormatNode);
                        contents.delete(targetNode.id);
                    }
                } else {
                    const wrapper = targetNode.clone();
                    wrapper.content = undefined;

                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    beforeNode.order = nodeOrder + segIdx * ORDER_EPS;
                    beforeNode.parent = wrapper.id;

                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    afterNode.order = nodeOrder + ORDER_MAJOR + segIdx * ORDER_EPS;
                    afterNode.parent = wrapper.id;

                    const newFormatNode = makeSpannedNode({
                        tagName: formattedTagName,
                        content: selectedText,
                        parent: wrapper.id,
                        order: nodeOrder + ORDER_EPS + segIdx * ORDER_EPS,
                    });

                    if (hasBefore) contents.set(beforeNode.id, beforeNode);
                    if (hasAfter) contents.set(afterNode.id, afterNode);

                    contents.set(newFormatNode.id, newFormatNode);
                    contents.set(wrapper.id, wrapper);
                    contents.delete(targetNode.id);
                }
            }
        } else {
            // ── REMOVE formatting ──
            if (matchedIdx === -1) return;

            // Fall back to rootNode if the parent isn't resolvable — keeps
            // `wrapper` guaranteed defined (the original `has ? get : root`
            // pattern could type-check to `NodeModel | undefined`).
            const wrapper: NodeModel = (originalParentId && descendants.get(originalParentId)) || rootNode;
            contents.delete(targetNode.id);

            if (wrapper.id === rootNode.id) {
                if (hasBefore) {
                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    contents.set(beforeNode.id, beforeNode);
                }

                // Preserve the text AFTER the selection (keep it formatted).
                if (hasAfter) {
                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    afterNode.order = (targetNode.order || 0) + ORDER_STEP;
                    contents.set(afterNode.id, afterNode);
                }

                // Handle the SELECTED text (remove the specific format).
                if (selectedText.length > 0) {
                    const unformattedNode = makeSpannedNode({
                        tagName: "span", // or the tag of the next parent in the chain
                        content: selectedText,
                        parent: wrapper.id, // attach it outside the removed wrapper
                        order: (targetNode.order || 0) + ORDER_EPS,
                    });
                    contents.set(unformattedNode.id, unformattedNode);
                    contents.delete(targetNode.id);
                }
            } else {
                if (hasBefore) {
                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    contents.set(beforeNode.id, beforeNode);
                }
                if (hasAfter) {
                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    afterNode.order = (targetNode.order || 0) + ORDER_STEP;
                    contents.set(afterNode.id, afterNode);
                }
                if (selectedText.length > 0) {
                    const unformattedNode = wrapper.clone();
                    unformattedNode.content = selectedText;
                    unformattedNode.parent = wrapper.id;
                    unformattedNode.order = (targetNode.order || 0) + ORDER_EPS;
                    contents.set(unformattedNode.id, unformattedNode);
                }
            }
        }
    });

    contents.delete(rootNode.id); // root was only there for measurement/lookup purposes

    normalizeNodeOrders(contents);
    cleanupEmptyFormatNodes(contents);

    mergeAdjacentFormatNodes(contents);
    mergeNestedFormatNodes(contents);
    mergeAdjacentFormatNodesWithWhitespace(contents);

    disableInteractions(contents);
    normalizeNodeOrders(contents);

    if (contents.size === 0) {
        console.warn("applyFormatted: all nodes were purged, aborting update.");
        return undefined;
    }

    return contents;
}

/**
 * Apply or remove `format` over the current selection.
 *
 * Wrapped in a try/catch: this function drives live editor state, so an
 * unexpected edge case (malformed chain, missing node, etc.) should degrade
 * to "no-op, log the error" rather than throwing and breaking the editor
 * mid-keystroke. If you're debugging a formatting issue, check the console
 * for an "applyFormatted failed" error first.
 */
export const applyFormatted = (props: ApplyFormattedProps): Map<string, NodeModel> | undefined => {
    try {
        return applyFormattedInternal(props);
    } catch (err) {
        console.error("applyFormatted failed:", err);
        return undefined;
    }
};