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
    const node = new NodeModel({
        id: nanoid(),
        type: "spanned",
        tagName: params.tagName,
        content: params.content,
        parent: params.parent,
        order: params.order,
    });

    if (params.tagName.toLowerCase() === "em") {
        const emType = Object.create(node.type);
        Object.defineProperty(emType, "name", {
            get: () => undefined,
            configurable: true,
        });
        (node as any).type = emType;
    }

    return node;
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

    const targetTagName = format === "bold" ? "strong" : format === "italic" ? "em" : "u";
    const formatOrder = ["strong", "em", "u"];

    const canonicalizeTag = (tagName?: string | null): string | null => {
        const normalized = tagName?.toLowerCase();
        if (!normalized) return null;
        if (normalized === "b" || normalized === "strong") return "strong";
        if (normalized === "i" || normalized === "em") return "em";
        if (normalized === "u") return "u";
        return null;
    };

    const flattenFragments = (): Array<{ text: string; tags: string[]; order: number }> => {
        const sourceMap = new Map(descendants);
        const nodes = Array.from(sourceMap.values())
            .filter((node) => typeof node.content === "string" && node.content.length > 0)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        if (nodes.length === 0 && rootNode.content) {
            return [{ text: rootNode.content, tags: [], order: 0 }];
        }

        const fragments: Array<{ text: string; tags: string[]; order: number }> = [];

        for (const node of nodes) {
            const tags: string[] = [];
            let current: NodeModel | null = node;

            while (current && current.parent && sourceMap.has(current.parent)) {
                const parent = sourceMap.get(current.parent);
                if (parent) {
                    const canonical = canonicalizeTag(parent.tagName);
                    if (canonical) {
                        tags.unshift(canonical);
                    }
                    current = parent;
                } else {
                    current = null;
                }
            }

            const selfTag = canonicalizeTag(node.tagName);
            if (selfTag) {
                tags.push(selfTag);
            }

            fragments.push({
                text: node.content || "",
                tags: [...new Set(tags)],
                order: node.order ?? 0,
            });
        }

        return fragments;
    };

    const fragments = flattenFragments();
    if (fragments.length === 0) return undefined;

    const isWhitespaceFragment = (text: string): boolean => /^\s*$/.test(text);
    const isChainPrefix = (left: string[], right: string[]): boolean => {
        if (left.length > right.length) return false;

        for (let index = 0; index < left.length; index++) {
            if (left[index] !== right[index]) return false;
        }

        return true;
    };

    const normalizeFragments = (
        sourceFragments: Array<{ text: string; tags: string[]; order: number }>,
    ) => {
        const normalized = sourceFragments.map((fragment) => ({
            ...fragment,
            tags: [...fragment.tags],
        }));

        for (let index = 0; index < normalized.length; index++) {
            const fragment = normalized[index];
            if (!isWhitespaceFragment(fragment.text)) continue;

            let leftIndex = index - 1;
            while (leftIndex >= 0 && isWhitespaceFragment(normalized[leftIndex].text)) {
                leftIndex -= 1;
            }

            let rightIndex = index + 1;
            while (rightIndex < normalized.length && isWhitespaceFragment(normalized[rightIndex].text)) {
                rightIndex += 1;
            }

            if (leftIndex < 0 || rightIndex >= normalized.length) continue;

            const left = normalized[leftIndex];
            const right = normalized[rightIndex];

            if (!left.text || !right.text) continue;

            const leftPrefixRight = isChainPrefix(left.tags, right.tags);
            if (!leftPrefixRight) continue;
            if (left.tags.length === 0 || right.tags.length === 0) continue;

            const promotedTags = [...right.tags];

            for (let cursor = leftIndex; cursor <= rightIndex; cursor++) {
                normalized[cursor].tags = [...promotedTags];
            }

            index = rightIndex;
        }

        const collapsed: Array<{ text: string; tags: string[]; order: number }> = [];

        for (const fragment of normalized) {
            if (!fragment.text) continue;

            const previous = collapsed[collapsed.length - 1];
            if (
                previous &&
                previous.tags.length === fragment.tags.length &&
                previous.tags.every((tag, tagIndex) => tag === fragment.tags[tagIndex])
            ) {
                previous.text += fragment.text;
                continue;
            }

            collapsed.push({
                text: fragment.text,
                tags: [...fragment.tags],
                order: fragment.order,
            });
        }

        return collapsed;
    };

    const fullText = fragments.map((fragment) => fragment.text).join("");
    const rangeStart = Math.max(0, Math.min(selection.anchor, selection.focus, fullText.length));
    const rangeEnd = Math.max(rangeStart, Math.min(Math.max(selection.anchor, selection.focus), fullText.length));

    if (rangeStart === rangeEnd) return undefined;

    let totalSelected = 0;
    let selectedTargetChars = 0;
    let cursor = 0;

    for (const fragment of fragments) {
        const fragmentStart = cursor;
        const fragmentEnd = fragmentStart + fragment.text.length;
        const overlapStart = Math.max(rangeStart, fragmentStart);
        const overlapEnd = Math.min(rangeEnd, fragmentEnd);

        if (overlapStart < overlapEnd) {
            const piece = fragment.text.slice(overlapStart - fragmentStart, overlapEnd - fragmentStart);
            totalSelected += piece.length;
            if (fragment.tags.includes(targetTagName)) {
                selectedTargetChars += piece.length;
            }
        }

        cursor = fragmentEnd;
    }

    const targetAction: "APPLY" | "REMOVE" = totalSelected > 0 && selectedTargetChars === totalSelected ? "REMOVE" : "APPLY";

    const outputFragments: Array<{ text: string; tags: string[]; order: number }> = [];
    cursor = 0;

    for (const fragment of fragments) {
        const fragmentStart = cursor;
        const fragmentEnd = fragmentStart + fragment.text.length;
        const overlapStart = Math.max(rangeStart, fragmentStart);
        const overlapEnd = Math.min(rangeEnd, fragmentEnd);

        if (overlapStart >= overlapEnd) {
            outputFragments.push({ text: fragment.text, tags: [...fragment.tags], order: fragment.order });
        } else {
            const beforeText = fragment.text.slice(0, overlapStart - fragmentStart);
            const selectedText = fragment.text.slice(overlapStart - fragmentStart, overlapEnd - fragmentStart);
            const afterText = fragment.text.slice(overlapEnd - fragmentStart);

            if (beforeText) {
                outputFragments.push({ text: beforeText, tags: [...fragment.tags], order: fragment.order });
            }

            if (selectedText) {
                const nextTags = targetAction === "APPLY"
                    ? [...new Set([...fragment.tags, targetTagName])].sort((a, b) => formatOrder.indexOf(a) - formatOrder.indexOf(b))
                    : [...new Set(fragment.tags.filter((tag) => tag !== targetTagName))].sort((a, b) => formatOrder.indexOf(a) - formatOrder.indexOf(b));

                outputFragments.push({ text: selectedText, tags: nextTags, order: fragment.order + 0.001 });
            }

            if (afterText) {
                outputFragments.push({ text: afterText, tags: [...fragment.tags], order: fragment.order + 0.002 });
            }
        }

        cursor = fragmentEnd;
    }

    const result = new Map<string, NodeModel>();
    let order = 0;

    const resolvedFragments = normalizeFragments(outputFragments);

    for (const fragment of resolvedFragments) {
        if (!fragment.text) continue;

        if (fragment.tags.length === 0) {
            const tagName = outputFragments.length === 1 && fragment.text === fullText ? rootNode.tagName : "span";
            const node = makeSpannedNode({
                tagName,
                content: fragment.text,
                parent: null,
                order,
            });
            result.set(node.id, node);
            order += 1;
            continue;
        }

        let parentId: string | null = null;
        for (let index = 0; index < fragment.tags.length; index++) {
            const tag = fragment.tags[index];
            const node = makeSpannedNode({
                tagName: tag,
                content: index === fragment.tags.length - 1 ? fragment.text : undefined,
                parent: parentId,
                order: order + index * 0.01,
            });
            result.set(node.id, node);
            parentId = node.id;
        }

        order += 1;
    }

    disableInteractions(result);
    return result.size > 0 ? result : undefined;
}

export const applyFormatted = (props: ApplyFormattedProps): Map<string, NodeModel> | undefined => {
    try {
        return applyFormattedInternal(props);
    } catch (err) {
        console.error("applyFormatted failed:", err);
        return undefined;
    }
};