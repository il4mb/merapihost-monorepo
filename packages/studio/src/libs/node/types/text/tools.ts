import { nanoid } from "nanoid";
import { NodeModel } from "../..";
import { TextTypeData } from "./TextType";

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

export const getTextNodes = (descendants: Map<string, NodeModel>, rootNode: NodeModel): NodeModel[] => {
    if (rootNode.content) return [rootNode];

    return Array.from(descendants.values())
        .filter((node) => node.content)
        .sort((a, b) => {
            if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
            const cmp = a.dom.compareDocumentPosition(b.dom);
            if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return (a.order || 0) - (b.order || 0);
        });
};

export type FormattedType = "bold" | "italic" | "underline" | "link";
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

    const targetTagName =
        format === "bold"
            ? "strong"
            : format === "italic"
              ? "em"
              : format === "underline"
                ? "u"
                : format === "link"
                  ? "a"
                  : null;
    if (!targetTagName) return undefined;
    const formatOrder = ["strong", "em", "u", "a"];

    const canonicalizeTag = (tagName?: string | null): string | null => {
        const normalized = tagName?.toLowerCase();
        if (!normalized) return null;
        if (normalized === "b" || normalized === "strong") return "strong";
        if (normalized === "i" || normalized === "em") return "em";
        if (normalized === "u") return "u";
        if (normalized === "a") return "a";
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

    const normalizeFragments = (sourceFragments: Array<{ text: string; tags: string[]; order: number }>) => {
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

    const targetAction: "APPLY" | "REMOVE" =
        totalSelected > 0 && selectedTargetChars === totalSelected ? "REMOVE" : "APPLY";

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
                const nextTags =
                    targetAction === "APPLY"
                        ? [...new Set([...fragment.tags, targetTagName])].sort(
                              (a, b) => formatOrder.indexOf(a) - formatOrder.indexOf(b),
                          )
                        : [...new Set(fragment.tags.filter((tag) => tag !== targetTagName))].sort(
                              (a, b) => formatOrder.indexOf(a) - formatOrder.indexOf(b),
                          );

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
