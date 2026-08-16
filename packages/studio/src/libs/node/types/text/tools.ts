import { nanoid } from "nanoid";
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

/**
 * Looking Upward Chain
 */
export const getAncestorChain = (startNode: NodeModel, map: Map<string, NodeModel>, rootId: string): NodeModel[] => {
    const chain: NodeModel[] = [];
    // check start node first
    let current = findNode(startNode.id, map);
    while (current && current.id !== rootId) {
        chain.push(current);
        current = findNode(current.parent, map);
    }
    return chain;
};

// Clone a slice of wrapper chain (index start..end, inclusive) from OUTER to INNER
export function cloneChainSlice(chain: NodeModel[], start: number, end: number, outerParentId: string | null, map: Map<string, NodeModel>): { innermostId: string; outermostId: string | null } {
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


const areMergeableFormatTags = (a: string, b: string): boolean => {
    const ta = a.toLowerCase();
    const tb = b.toLowerCase();
    if (ta === tb) return true; // span===span, div===div, etc.
    if ((ta === "b" || ta === "strong") && (tb === "b" || tb === "strong")) return true;
    if ((ta === "i" || ta === "em") && (tb === "i" || tb === "em")) return true;
    if (ta === "u" && tb === "u") return true;
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

                const bothFormatNode = isMergeable(curr) && isMergeable(next);
                if (bothFormatNode && areMergeableFormatTags(curr.tagName, next.tagName)) {
                    const merged = new NodeModel(curr);
                    merged.content = (merged.content || "") + (next.content || "");
                    map.set(curr.id, merged);
                    map.delete(next.id);
                    changed = true;
                    break;
                }
            }
        });
    }
};


export const cleanupEmptyFormatNodes = (map: Map<string, NodeModel>) => {
    let changed = true;
    while (changed) {
        changed = false;
        const emptyFormatNodes = Array.from(map.values()).filter((n) => isEmptyContent(n, map));
        for (const node of emptyFormatNodes) {
            map.delete(node.id);
            changed = true;
        }
    }
};


export const purgeOrphanNodes = (map: Map<string, NodeModel>, rootId: string) => {
    const validIds = new Set<string>();
    const traverse = (id: string) => {
        validIds.add(id);
        const children = Array.from(map.values()).filter((n) => n.parent === id);
        children.forEach((child) => traverse(child.id));
    };
    traverse(rootId);

    map.forEach((n, id) => {
        if (!validIds.has(id)) {
            map.delete(id);
        }
    });
};

export const normalizeOrders = (map: Map<string, NodeModel>, rootId: string) => {

    const normalize = (parentId: string) => {
        const children = Array.from(map.values())
            .filter((n) => n.parent === parentId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        children.forEach((child, index) => {
            child.order = index;
            normalize(child.id);
        });
    };

    normalize(rootId);
}

export const disableInteractions = (map: Map<string, NodeModel>) => {
    map.forEach(node => {
        node.selectable = false;
        node.hoverable = false;
    });
}

export const normalizeTree = (map: Map<string, NodeModel>, rootId: string) => {
    purgeOrphanNodes(map, rootId);
    mergeAdjacentFormatNodes(map);
    // cleanupEmptyFormatNodes(map);
    normalizeOrders(map, rootId);
    disableInteractions(map);
};
