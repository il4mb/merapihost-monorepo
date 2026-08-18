import { nanoid } from "nanoid";
import {
    findNode,
    getNodeAncestorChain,
    getNodeChildren,
    getNodeDescendants,
    NodeModel,
    normalizeNodeOrders,
    toNodeTree,
} from "../..";
import { TextTypeData } from "./TextType";

type Contents = Map<string, NodeModel>;

// ---------------------------------------------------------------------------
// Konstanta spacing untuk `order`
// ---------------------------------------------------------------------------
const ORDER_EPS = 0.001;
const ORDER_MINOR = 0.01;
const ORDER_MAJOR = 0.02;
const ORDER_STEP = 0.002;

const MAX_FIXPOINT_ITERATIONS = 5000;

// ---------------------------------------------------------------------------
// Helper: index anak per parent
// ---------------------------------------------------------------------------
function buildChildIndex(collections: Map<string, NodeModel>): Map<string, NodeModel[]> {
    const index = new Map<string, NodeModel[]>();

    for (const node of collections.values()) {
        if (!node.parent) continue;
        const group = index.get(node.parent);
        if (group) {
            group.push(node);
        } else {
            index.set(node.parent, [node]);
        }
    }

    for (const group of index.values()) {
        group.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    return index;
}

// ---------------------------------------------------------------------------
// Helper kecil untuk membuat node "spanned"
// ---------------------------------------------------------------------------
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

type FormatFamily = "bold" | "italic" | "underline";

const getFormatFamily = (tagName: string): FormatFamily | null => {
    const tag = tagName.toLowerCase();
    if (tag === "strong" || tag === "b") return "bold";
    if (tag === "em" || tag === "i") return "italic";
    if (tag === "u") return "underline";
    return null;
};

const isMergeable = (node: NodeModel): boolean => node.type.isText;
const isWhitespaceOnly = (content: string | undefined): boolean =>
    Boolean(content) && /^\s*$/.test(content || "");

const areMergeableFormatTags = (a: string, b: string) => {
    const ta = a.toLowerCase();
    const tb = b.toLowerCase();
    if (ta === tb) return true;
    if ((ta === "b" || ta === "strong") && (tb === "b" || tb === "strong")) return true;
    if ((ta === "i" || ta === "em") && (tb === "i" || tb === "em")) return true;
    return ta === "u" && tb === "u";
};

// ---------------------------------------------------------------------------
// Loop fixpoint dengan batas aman
// ---------------------------------------------------------------------------
function runFixpoint(label: string, step: () => boolean): void {
    let changed = true;
    let iterations = 0;

    while (changed) {
        if (++iterations > MAX_FIXPOINT_ITERATIONS) {
            console.warn(`${label}: melebihi ${MAX_FIXPOINT_ITERATIONS} iterasi, dihentikan.`);
            break;
        }
        changed = step();
    }
}

// ---------------------------------------------------------------------------
// Merge node berformat sama yang bersebelahan (termasuk dipisah whitespace)
// ---------------------------------------------------------------------------
const mergeAdjacentFormatNodesWithWhitespace = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("mergeAdjacentFormatNodesWithWhitespace", () => {
        const childIndex = buildChildIndex(descendants);

        for (const children of childIndex.values()) {
            for (let i = 0; i < children.length - 1; i++) {
                const current = children[i];
                const next = children[i + 1];

                if (
                    isMergeable(current) &&
                    isMergeable(next) &&
                    areMergeableFormatTags(current.tagName, next.tagName)
                ) {
                    const merged = new NodeModel(current);
                    merged.content = (current.content ?? "") + (next.content ?? "");
                    descendants.set(current.id, merged);
                    descendants.delete(next.id);
                    return true;
                }

                if (i < children.length - 2) {
                    const whitespace = next;
                    const afterWhitespace = children[i + 2];

                    if (
                        isWhitespaceOnly(whitespace.content) &&
                        isMergeable(current) &&
                        isMergeable(afterWhitespace) &&
                        areMergeableFormatTags(current.tagName, afterWhitespace.tagName)
                    ) {
                        const merged = new NodeModel(current);
                        merged.content =
                            (current.content ?? "") +
                            (whitespace.content ?? "") +
                            (afterWhitespace.content ?? "");
                        descendants.set(current.id, merged);
                        descendants.delete(whitespace.id);
                        descendants.delete(afterWhitespace.id);
                        return true;
                    }
                }
            }
        }

        return false;
    });
};

// ---------------------------------------------------------------------------
// Promosikan anak dari <span> yang tidak perlu (fixpoint)
// ---------------------------------------------------------------------------
const promoteNestedFormatNodes = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("promoteNestedFormatNodes", () => {
        const childIndex = buildChildIndex(descendants);
        let changed = false;

        for (const id of childIndex.keys()) {
            const target = descendants.get(id);
            if (!target) continue;

            if (target.tagName === "span" && (childIndex.get(id)?.length ?? 0) > 0) {
                const children = childIndex.get(id)!;
                for (const child of children) {
                    child.parent = target.parent;
                    child.order = target.order + ORDER_EPS * child.order;
                }
                descendants.delete(target.id);
                changed = true;
            }
        }

        return changed;
    });
};

// ---------------------------------------------------------------------------
// Hapus node kosong (bottom-up, fixpoint)
// ---------------------------------------------------------------------------
const cleanupEmptyFormatNodes = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("cleanupEmptyFormatNodes", () => {
        const childIndex = buildChildIndex(descendants);
        const emptyCache = new Map<string, boolean>();

        const computeEmpty = (node: NodeModel): boolean => {
            const cached = emptyCache.get(node.id);
            if (cached !== undefined) return cached;

            const children = childIndex.get(node.id) ?? [];
            const result =
                children.length > 0 ? children.every((child) => computeEmpty(child)) : !Boolean(node.content);

            emptyCache.set(node.id, result);
            return result;
        };

        const empties = Array.from(descendants.values()).filter((n) => computeEmpty(n));
        for (const node of empties) descendants.delete(node.id);

        return empties.length > 0;
    });
};

const disableInteractions = (descendants: Map<string, NodeModel>): void => {
    descendants.forEach((node) => {
        node.selectable = false;
        node.hoverable = false;
    });
};

// ---------------------------------------------------------------------------
// Selection segments
// ---------------------------------------------------------------------------
export type SelectionSegment = {
    node: NodeModel;
    globalStart: number;
    globalEnd: number;
    localStart: number;
    localEnd: number;
    isFull: boolean;
    isPartial: boolean;
};

export const getTextNodes = (
    descendants: Map<string, NodeModel>,
    rootNode: NodeModel
): NodeModel[] => {
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

// ---------------------------------------------------------------------------
// Helper: cek apakah node atau salah satu ancestor-nya punya format target
// ---------------------------------------------------------------------------
const isNodeFormatted = (
    node: NodeModel,
    targetTagName: string,
    contents: Map<string, NodeModel>,
    rootId: string
): boolean => {
    // 1. Cek node itu sendiri (leaf yang langsung berformat)
    if (node.tagName === targetTagName) return true;

    // 2. Cek ancestor
    const chain = getNodeAncestorChain(node.id, rootId, contents);
    return chain.some((w) => w.tagName === targetTagName);
};

export type FormattedType = "bold" | "italic" | "underline";
export type Selection = { anchor: number; focus: number };
export type ApplyFormattedProps = {
    format: FormattedType;
    descendants: Map<string, NodeModel>;
    selection: Selection;
    node: NodeModel<TextTypeData>;
};

// ---------------------------------------------------------------------------
// Implementasi inti
// ---------------------------------------------------------------------------
function applyFormattedInternal({
    format,
    node: rootNode,
    selection,
    descendants,
}: ApplyFormattedProps): Map<string, NodeModel> | undefined {
    if (selection.anchor === selection.focus) return undefined;

    const selStart = Math.min(selection.anchor, selection.focus);
    const selEnd = Math.max(selection.anchor, selection.focus);

    const targetTagName = format === "bold" ? "strong" : format === "italic" ? "em" : "u";

    const contents = new Map(descendants);
    contents.set(rootNode.id, rootNode);

    const segments = getSelectionSegments(selStart, selEnd, contents, rootNode);
    if (segments.length === 0) return undefined;

    // Tentukan aksi berdasarkan apakah SEMUA segmen sudah berformat target
    const isAllFormatted = segments.every((seg) =>
        isNodeFormatted(seg.node, targetTagName, contents, rootNode.id)
    );
    const targetAction: "APPLY" | "REMOVE" = isAllFormatted ? "REMOVE" : "APPLY";

    for (const seg of segments) {
        const segIdx = segments.indexOf(seg);
        const targetNode = seg.node;
        const targetIsRoot = targetNode.id === rootNode.id;

        const startOffset = seg.localStart;
        const endOffset = seg.localEnd;
        const overlapLength = endOffset - startOffset;
        if (overlapLength === 0) continue;

        const originalContent = targetNode.content || "";
        const before = originalContent.slice(0, startOffset);
        const selectedText = originalContent.slice(startOffset, endOffset);
        const after = originalContent.slice(endOffset);
        const hasBefore = before.length > 0;
        const hasAfter = after.length > 0;
        const baseOrder = targetNode.order || 0;
        const chain = getNodeAncestorChain(targetNode.id, rootNode.id, contents);
        const matchedAncestorIdx = chain.findIndex((w) => w.tagName === targetTagName);
        const selfFormatted = targetNode.tagName === targetTagName;

        if (targetAction === "APPLY") {
            // Jika sudah terformat (di node sendiri atau ancestor), lewati
            if (isNodeFormatted(targetNode, targetTagName, contents, rootNode.id)) continue;

            // Ubah targetNode menjadi wrapper
            targetNode.content = undefined;

            // Buat node format untuk teks terpilih
            const newFormatNode = makeSpannedNode({
                tagName: targetTagName,
                content: selectedText,
                parent: targetNode.id,
                order: baseOrder + ORDER_EPS + segIdx * ORDER_EPS,
            });

            // Node sebelum/sesudah yang tidak terpilih harus tetap plain text agar
            // tidak mewarisi tag blok root seperti p/h1 ketika sebagian teks dibold.
            const plainTextTag = targetNode.id === rootNode.id ? "span" : targetNode.tagName;

            if (hasBefore) {
                const beforeNode = newFormatNode.clone();
                beforeNode.content = before;
                beforeNode.tagName = plainTextTag;
                beforeNode.order = baseOrder + segIdx * ORDER_EPS;
                beforeNode.parent = targetNode.id;
                contents.set(beforeNode.id, beforeNode);
            }

            if (hasAfter) {
                const afterNode = newFormatNode.clone();
                afterNode.content = after;
                afterNode.tagName = plainTextTag;
                afterNode.order = baseOrder + ORDER_MAJOR + segIdx * ORDER_EPS;
                afterNode.parent = targetNode.id;
                contents.set(afterNode.id, afterNode);
            }

            contents.set(newFormatNode.id, newFormatNode);
        } else {
            // ── REMOVE formatting ──
            if (!selfFormatted && matchedAncestorIdx === -1) continue;

            const relevantChain = chain.length > 0 ? chain : [targetNode];
            const lastIdx = relevantChain.length - 1;
            const outermostWrapper = relevantChain[lastIdx];
            const isOutermostTarget = matchedAncestorIdx === lastIdx;

            // Jangan menghapus root node atau parent yang memegang teks utama.
            if (targetNode.id !== rootNode.id) {
                contents.delete(targetNode.id);
            }

            for (let i = 0; i <= lastIdx; i++) {
                if (i === lastIdx && !isOutermostTarget) {
                    continue;
                }
                if (relevantChain[i].id === rootNode.id) {
                    continue;
                }
                contents.delete(relevantChain[i].id);
            }

            const createBranch = (text: string, isSelected: boolean, orderOffset: number) => {
                const fallbackParentId = outermostWrapper?.parent ?? rootNode.parent ?? rootNode.id;
                let currentParentId: string | null = fallbackParentId;

                if (!isOutermostTarget && outermostWrapper) {
                    currentParentId = outermostWrapper.id;
                    for (let i = lastIdx - 1; i >= 0; i--) {
                        if (isSelected && i === matchedAncestorIdx) continue;
                        const clone = relevantChain[i].clone();
                        clone.parent = currentParentId;
                        clone.order = baseOrder + orderOffset;
                        contents.set(clone.id, clone);
                        currentParentId = clone.id;
                    }
                } else {
                    for (let i = lastIdx; i >= 0; i--) {
                        if (isSelected && i === matchedAncestorIdx) continue;
                        const clone = relevantChain[i].clone();
                        clone.parent = currentParentId;
                        clone.order = baseOrder + orderOffset;
                        contents.set(clone.id, clone);
                        currentParentId = clone.id;
                    }
                }

                const newTextNode = targetNode.clone();
                newTextNode.content = text;
                if (selfFormatted) {
                    newTextNode.tagName = "span";
                }
                newTextNode.parent = currentParentId;
                newTextNode.order = baseOrder + orderOffset;
                contents.set(newTextNode.id, newTextNode);
            };

            if (hasBefore) createBranch(before, false, segIdx * ORDER_EPS);
            createBranch(selectedText, true, ORDER_EPS + segIdx * ORDER_EPS);
            if (hasAfter) createBranch(after, false, ORDER_MAJOR + segIdx * ORDER_EPS);
        }
    }

    // contents.delete(rootNode.id);

    // Pasca-pemrosesan
    normalizeNodeOrders(contents);
    promoteNestedFormatNodes(contents);
    cleanupEmptyFormatNodes(contents);
    mergeAdjacentFormatNodesWithWhitespace(contents);
    disableInteractions(contents);
    normalizeNodeOrders(contents);

    if (contents.size === 1 && contents.has(rootNode.id) && !rootNode.content) {
        console.warn("applyFormatted: semua node terhapus, update dibatalkan.");
        return undefined;
    }

    return contents;
}

export const applyFormatted = (props: ApplyFormattedProps): Map<string, NodeModel> | undefined => {
    try {
        return applyFormattedInternal(props);
    } catch (err) {
        console.error("applyFormatted failed:", err);
        return undefined;
    }
};