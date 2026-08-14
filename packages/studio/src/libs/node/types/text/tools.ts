import { NodeModel } from "../..";

export const getFrameContext = (dom: HTMLElement | null) => {
    const el = dom;
    if (!el) return null;
    const doc = el.ownerDocument;
    const win = doc.defaultView;
    if (!win) return null;
    const selection = win.getSelection();
    return { el, doc, win, selection };
}

// Helper to check equivalent formatting tags (e.g. <b> and <strong>)
export const isSameFormatTag = (tagName: string, format: "bold" | "italic" | "underline") => {
    const t = tagName.toLowerCase();
    if (format === "bold") return t === "strong" || t === "b";
    if (format === "italic") return t === "em" || t === "i";
    if (format === "underline") return t === "u";
    return false;
};

// Calculate absolute character offsets relative to container text
export const getGlobalCharOffsets = (containerEl: HTMLElement, range: Range) => {
    const doc = containerEl.ownerDocument;
    const startRange = doc.createRange();
    startRange.selectNodeContents(containerEl);
    startRange.setEnd(range.startContainer, range.startOffset);
    const start = startRange.toString().length;

    const endRange = doc.createRange();
    endRange.selectNodeContents(containerEl);
    endRange.setEnd(range.endContainer, range.endOffset);
    const end = endRange.toString().length;

    return { start, end };
};

// Restore DOM range from absolute character offsets
export const setGlobalCharOffsets = (containerEl: HTMLElement, start: number, end: number) => {
    const doc = containerEl.ownerDocument;
    const win = doc.defaultView;
    if (!win) return;
    const selection = win.getSelection();
    if (!selection) return;

    let currentPos = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;

    const walker = doc.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null);
    let currentNode = walker.nextNode();

    while (currentNode) {
        const textLen = currentNode.nodeValue?.length || 0;

        if (!startNode && currentPos + textLen >= start) {
            startNode = currentNode;
            startOffset = start - currentPos;
        }
        if (!endNode && currentPos + textLen >= end) {
            endNode = currentNode;
            endOffset = end - currentPos;
            break;
        }

        currentPos += textLen;
        currentNode = walker.nextNode();
    }

    if (startNode && endNode) {
        const newRange = doc.createRange();
        newRange.setStart(startNode, Math.min(startOffset, startNode.nodeValue?.length || 0));
        newRange.setEnd(endNode, Math.min(endOffset, endNode.nodeValue?.length || 0));

        selection.removeAllRanges();
        selection.addRange(newRange);
    }
};

// Depth-First Search (DFS) traversal in strict document tree order
export const getTreeOrderedNodes = (rootId: string, map: Map<string, NodeModel>): NodeModel[] => {
    const result: NodeModel[] = [];
    const traverse = (parentId: string) => {
        const children = Array.from(map.values())
            .filter((n) => n.parent === parentId)
            .sort((a, b) => {
                const diff = (a.order || 0) - (b.order || 0);
                return diff !== 0 ? diff : a.id.localeCompare(b.id);
            });

        for (const child of children) {
            result.push(child);
            traverse(child.id);
        }
    };
    traverse(rootId);
    return result;
};

export const findNode = (id: string | null | undefined, map: Map<string, NodeModel>): NodeModel | null =>
    id ? map.get(id) ?? null : null;

export const getAncestorChain = (startNode: NodeModel, map: Map<string, NodeModel>, rootId: string): NodeModel[] => {
    const chain: NodeModel[] = [];
    let current = findNode(startNode.parent, map);
    while (current && current.id !== rootId) {
        chain.push(current);
        current = findNode(current.parent, map);
    }
    return chain;
};

// Clone a slice of wrapper chain (index start..end, inclusive) from OUTER to INNER
export function cloneChainSlice(
    chain: NodeModel[],
    start: number,
    end: number,
    outerParentId: string | null,
    map: Map<string, NodeModel>
): { innermostId: string; outermostId: string | null } {
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

// Merge adjacent FormatNodes with identical or equivalent tag names across the tree
export const mergeAdjacentFormatNodes = (map: Map<string, NodeModel>) => {
    let changed = true;
    while (changed) {
        changed = false;
        const parentGroups = new Map<string, NodeModel[]>();

        map.forEach((n) => {
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

                const bothFormatNode =
                    curr.type.name.toLowerCase() === "formatnode" &&
                    next.type.name.toLowerCase() === "formatnode";

                if (bothFormatNode && curr.tagName.toLowerCase() === next.tagName.toLowerCase()) {
                    const nextChildren = Array.from(map.values())
                        .filter((c) => c.parent === next.id)
                        .sort((a, b) => (a.order || 0) - (b.order || 0));

                    const currChildren = Array.from(map.values())
                        .filter((c) => c.parent === curr.id);

                    let startOrd = currChildren.length;
                    nextChildren.forEach((child) => {
                        child.parent = curr.id;
                        child.order = startOrd++;
                    });

                    map.delete(next.id);
                    changed = true;
                    break;
                }
            }
        });
    }
};

export function mergeAdjacentTextNodes(newContents: Map<string, NodeModel>) {
    const parentIds = new Set(Array.from(newContents.values()).map((n) => n.parent));

    parentIds.forEach((parentId) => {
        if (!parentId) return;

        let merged = true;
        while (merged) {
            merged = false;

            // 1. Get ALL direct children of this parent sorted strictly by order
            const siblings = Array.from(newContents.values())
                .filter((n) => n.parent === parentId)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            // 2. Check DIRECTLY CONSECUTIVE pairs only
            for (let i = 0; i < siblings.length - 1; i++) {
                const current = siblings[i];
                const next = siblings[i + 1];

                const isCurrentText = String(current.type?.name || current.type)?.toLowerCase() === "textnode";
                const isNextText = String(next.type?.name || next.type)?.toLowerCase() === "textnode";

                // Only merge if there is NO formatnode sitting between them
                if (isCurrentText && isNextText) {
                    current.content = (current.content || "") + (next.content || "");
                    newContents.delete(next.id);
                    merged = true;
                    break; // Restart scan for this parent
                }
            }
        }
    });

    // Clean up orphan empty text nodes if they have siblings
    parentIds.forEach((parentId) => {
        if (!parentId) return;
        const siblings = Array.from(newContents.values()).filter((n) => n.parent === parentId);
        if (siblings.length > 1) {
            siblings.forEach((n) => {
                const isText = String(n.type?.name || n.type)?.toLowerCase() === "textnode";
                if (isText && (!n.content || n.content.length === 0)) {
                    newContents.delete(n.id);
                }
            });
        }
    });
}