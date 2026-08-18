import { nanoid } from "nanoid";
import { findNode, getNodeAncestorChain, NodeModel, normalizeNodeOrders } from "../..";
import { TextTypeData } from "./TextType";

// ---------------------------------------------------------------------------
// Konstanta spacing untuk `order`
// ---------------------------------------------------------------------------
// NodeModel.order bertipe float. Increment kecil ini memungkinkan sibling baru
// (hasil split/insert) disisipkan di antara node yang sudah ada tanpa perlu
// re-normalisasi penuh setiap kali insert (normalizeNodeOrders() cukup
// dijalankan sekali di akhir). Nilai-nilai di bawah ini dipertahankan persis
// seperti implementasi awal — JANGAN diubah tanpa mengecek ulang semua
// pemanggilnya, karena normalizeNodeOrders() hanya menjamin urutan *relatif*
// yang benar, bukan nilai absolutnya.
const ORDER_EPS = 0.001; // increment terkecil, biasanya dikalikan segIdx
const ORDER_MINOR = 0.01; // offset gaya "before"
const ORDER_MAJOR = 0.02; // offset gaya "after"
const ORDER_STEP = 0.002; // offset "after" khusus untuk cabang REMOVE

// Batas aman untuk loop fixed-point `while (changed) { ... }` di bawah.
// Secara normal tidak ada loop ini yang butuh iterasi sebanyak ini untuk
// dokumen nyata; nilai ini murni jaring pengaman supaya bug di masa depan
// (mis. kondisi merge yang tidak pernah stabil) berakhir dengan warning di
// console, bukan hang di tab browser.
const MAX_FIXPOINT_ITERATIONS = 5000;

// ---------------------------------------------------------------------------
// Helper: index anak per parent
// ---------------------------------------------------------------------------
// Dipakai di banyak tempat untuk menghindari pola
// `Array.from(map.values()).filter(n => n.parent === id)` yang diulang-ulang
// di dalam loop/rekursi (yang bisa membuat kompleksitas menjadi O(n^2) pada
// dokumen besar). Index ini dibangun sekali per "pass", lalu dipakai untuk
// semua lookup anak dalam pass tersebut.
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

/**
 * Kloning sebagian rantai wrapper (index start..end, inklusif), dari OUTER
 * ke INNER, lalu re-parent hasil kloningnya di bawah `outerParentId`.
 *
 * Return:
 *  - innermostId: id dari clone paling dalam (atau `outerParentId` jika slice
 *    kosong, yaitu start > end)
 *  - outermostId: id dari clone paling luar, atau null jika slice kosong
 */
export function cloneChainSlice(chain: NodeModel[], start: number, end: number, outerParentId: string | null, map: Map<string, NodeModel>): { innermostId: string; outermostId: string | null } {
    if (start > end) {
        // Slice kosong: tidak ada yang perlu dikloning, "innermost" langsung
        // jadi parent aslinya.
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

    // Loop pasti berjalan minimal sekali (start <= end), jadi parentId sudah
    // pasti berupa id clone yang valid (non-null) di titik ini.
    return { innermostId: parentId as string, outermostId };
}

// ---------------------------------------------------------------------------
// Helper kecil untuk membuat node "spanned"
// ---------------------------------------------------------------------------
// Dipakai di setiap tempat yang membuat node "spanned" baru dari nol (beda
// dengan `.clone()` sebuah node yang sudah ada, yang sengaja mempertahankan
// properti lain dari node sumbernya).
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

/**
 * Cek apakah rantai wrapper dari `leaf` sampai ke atas aman untuk
 * "dikolaps"/ditulis ulang — yaitu setiap wrapper di rantainya cuma punya
 * satu anak. Dioptimalkan dengan `childIndex` (bukan filter ulang seluruh
 * map di setiap level rantai).
 */
const canCollapseChain = (
    leaf: NodeModel,
    collections: Map<string, NodeModel>,
    childIndex: Map<string, NodeModel[]> = buildChildIndex(collections)
): boolean => {
    let current = leaf;

    while (current.parent) {
        const parent = collections.get(current.parent);
        if (!parent) break;

        const siblingCount = childIndex.get(parent.id)?.length ?? 0;
        if (siblingCount !== 1) return false;

        if (!isMergeable(parent)) break;

        current = parent;
    }

    return true;
};

const mergeEquivalentChains = (
    left: NodeModel,
    right: NodeModel,
    whitespaceNodes: NodeModel[],
    canonicalTags: string[],
    collections: Map<string, NodeModel>
) => {
    const parentId = left.parent;
    if (!parentId) return;

    // Gabungkan teksnya (left + spasi di antara + right).
    const whitespace = whitespaceNodes.map((node) => node.content ?? "").join("");
    const content = (left.content ?? "") + whitespace + (right.content ?? "");

    // Hapus rantai formatting lama.
    const removeChain = (leaf: NodeModel) => {
        let current: NodeModel | undefined = leaf;

        while (current) {
            const parentId = current.parent;
            collections.delete(current.id);

            if (!parentId) break;

            const parent = collections.get(parentId);
            if (!parent || !isMergeable(parent)) break;

            current = parent;
        }
    };

    removeChain(left);
    removeChain(right);

    for (const whitespaceNode of whitespaceNodes) {
        collections.delete(whitespaceNode.id);
    }

    // Bangun ulang memakai urutan format sisi kiri sebagai bentuk kanonik.
    // Contoh: strong > em  =>  strong > em > "Hello World"
    let currentParent = parentId;
    let order = left.order;

    for (let i = 0; i < canonicalTags.length; i++) {
        const isLast = i === canonicalTags.length - 1;

        const node = makeSpannedNode({
            tagName: canonicalTags[i],
            content: isLast ? content : undefined,
            parent: currentParent,
            order,
        });

        collections.set(node.id, node);
        currentParent = node.id;
        order = 0;
    }
};

const getFormatChain = (
    node: NodeModel,
    rootId: string,
    collections: Map<string, NodeModel>
): NodeModel[] => {
    const chain: NodeModel[] = [];
    let current: NodeModel | undefined = node;

    while (current && current.id !== rootId) {
        if (isMergeable(current)) chain.unshift(current);
        if (!current.parent) break;
        current = collections.get(current.parent);
    }

    return chain;
};

const getFormatSignature = (chain: NodeModel[]): string => {
    return chain
        .map((node) => getFormatFamily(node.tagName))
        .filter((x): x is FormatFamily => x !== null)
        .sort()
        .join("|");
};

const isSameFormatTag = (tagName: string, format: FormattedType): boolean => {
    const t = tagName.toLowerCase();
    if (format === "bold") return t === "strong" || t === "b";
    if (format === "italic") return t === "em" || t === "i";
    if (format === "underline") return t === "u";
    return false;
};

const isMergeable = (node: NodeModel): boolean => node.type.isText;

/** True jika `content` ada dan isinya hanya whitespace. */
const isWhitespaceOnly = (content: string | undefined): boolean => {
    return Boolean(content) && /^\s*$/.test(content || "");
};

const areMergeableFormatTags = (a: string, b: string) => {
    const ta = a.toLowerCase();
    const tb = b.toLowerCase();

    if (ta === tb) return true;
    if ((ta === "b" || ta === "strong") && (tb === "b" || tb === "strong")) return true;
    if ((ta === "i" || ta === "em") && (tb === "i" || tb === "em")) return true;

    return ta === "u" && tb === "u";
};

/** Jalankan loop fix-point `while (changed)` dengan batas aman, supaya bug
 *  di kondisi merge tidak bisa menggantung tab — cukup berhenti + warning. */
function runFixpoint(label: string, step: () => boolean): void {
    let changed = true;
    let iterations = 0;

    while (changed) {
        if (++iterations > MAX_FIXPOINT_ITERATIONS) {
            console.warn(`${label}: melebihi ${MAX_FIXPOINT_ITERATIONS} iterasi, dihentikan untuk mencegah hang.`);
            break;
        }
        changed = step();
    }
}

const normalizeEquivalentFormatChains = (collections: Map<string, NodeModel>): void => {
    runFixpoint("normalizeEquivalentFormatChains", () => {
        const childIndex = buildChildIndex(collections);

        for (const children of childIndex.values()) {
            for (let i = 0; i < children.length - 1; i++) {
                const left = children[i];

                // Cari text node berikutnya yang "bermakna" (punya content),
                // lewati whitespace-only node di antaranya.
                let j = i + 1;
                const whitespaceNodes: NodeModel[] = [];

                while (j < children.length) {
                    const candidate = children[j];

                    if (isMergeable(candidate) && candidate.content) break;

                    if (isMergeable(candidate) && isWhitespaceOnly(candidate.content)) {
                        whitespaceNodes.push(candidate);
                        j++;
                        continue;
                    }

                    break;
                }

                if (j >= children.length) continue;

                const right = children[j];
                if (!isMergeable(left) || !isMergeable(right)) continue;
                if (!left.content || !right.content) continue;

                // Ambil rantai formatting lengkap masing-masing sisi.
                const leftChain = getFormatChain(left, left.parent!, collections);
                const rightChain = getFormatChain(right, right.parent!, collections);

                if (leftChain.length === 0 || rightChain.length === 0) continue;

                // Bandingkan formatting efektifnya.
                // strong>em dan em>strong sama-sama jadi "bold|italic".
                const leftSignature = getFormatSignature(leftChain);
                const rightSignature = getFormatSignature(rightChain);

                if (!leftSignature || leftSignature !== rightSignature) continue;

                const canonicalTags = leftChain.map((node) => node.tagName);

                // Hanya aman menulis ulang rantai kalau tiap wrapper punya
                // tepat satu anak.
                if (!canCollapseChain(left, collections, childIndex) || !canCollapseChain(right, collections, childIndex)) {
                    continue;
                }

                mergeEquivalentChains(left, right, whitespaceNodes, canonicalTags, collections);
                return true;
            }
        }

        return false;
    });
};

const mergeAdjacentFormatNodesWithWhitespace = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("mergeAdjacentFormatNodesWithWhitespace", () => {
        const childIndex = buildChildIndex(descendants);

        for (const children of childIndex.values()) {
            for (let i = 0; i < children.length - 1; i++) {
                const current = children[i];
                const next = children[i + 1];

                if (isMergeable(current) && isMergeable(next) && areMergeableFormatTags(current.tagName, next.tagName)) {
                    const merged = new NodeModel(current);
                    merged.content = (current.content ?? "") + (next.content ?? "");

                    descendants.set(current.id, merged);
                    descendants.delete(next.id);
                    return true;
                }

                // Node whitespace di antara dua format yang sama.
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
                        merged.content = (current.content ?? "") + (whitespace.content ?? "") + (afterWhitespace.content ?? "");

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

const mergeAdjacentFormatNodes = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("mergeAdjacentFormatNodes", () => {
        const childIndex = buildChildIndex(descendants);

        for (const children of childIndex.values()) {
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
        const childIndex = buildChildIndex(descendants);

        for (const node of descendants.values()) {
            if (!isMergeable(node)) continue;

            const children = childIndex.get(node.id) ?? [];
            // Hanya flatten wrapper yang punya tepat satu anak.
            if (children.length !== 1) continue;

            const nested = children[0];
            if (!isMergeable(nested) || !areMergeableFormatTags(node.tagName, nested.tagName)) continue;

            // Pindahkan cucu langsung ke bawah `node`.
            const grandchildren = childIndex.get(nested.id) ?? [];
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

/**
 * Hapus node yang "kosong" (tidak punya content sendiri maupun keturunan
 * dengan content). Status kosong dihitung bottom-up dalam satu pass memakai
 * childIndex + cache, sehingga satu pass = O(n) — bukan O(n^2) seperti versi
 * yang memfilter ulang seluruh map untuk setiap node/pemanggilan rekursif.
 */
const cleanupEmptyFormatNodes = (descendants: Map<string, NodeModel>): void => {
    runFixpoint("cleanupEmptyFormatNodes", () => {
        const childIndex = buildChildIndex(descendants);
        const emptyCache = new Map<string, boolean>();

        const computeEmpty = (node: NodeModel): boolean => {
            const cached = emptyCache.get(node.id);
            if (cached !== undefined) return cached;

            const children = childIndex.get(node.id) ?? [];
            const result = children.length > 0 ? children.every((child) => computeEmpty(child)) : !Boolean(node.content);

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
    // Jika root sendiri yang punya content string (plain text, tanpa descendant)
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
 * Implementasi inti. Dipisah dari `applyFormatted` yang di-export supaya
 * fungsi export bisa membungkusnya dengan try/catch (lihat di bawah) tanpa
 * perlu menge-indent seluruh isi fungsi ini.
 */
function applyFormattedInternal({ format, node: rootNode, selection, descendants }: ApplyFormattedProps): Map<string, NodeModel> | undefined {
    if (selection.anchor === selection.focus) return undefined;

    const selStart = Math.min(selection.anchor, selection.focus);
    const selEnd = Math.max(selection.anchor, selection.focus);

    const formattedTagName = format === "bold" ? "strong" : format === "italic" ? "em" : "u";

    const contents = new Map(descendants);
    contents.set(rootNode.id, rootNode); // pastikan root ikut tersedia untuk lookup rantai

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

        // Nilai order asli node target — dipakai di semua cabang di bawah
        // (sebelumnya ada dua variabel terpisah `baseOrder`/`nodeOrder`
        // dengan nilai yang identik; disatukan jadi satu).
        const baseOrder = targetNode.order || 0;
        const originalParentId = targetIsRoot ? rootNode.id : targetNode.parent;

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
                        // Ada wrapper "spanned" leluhur → clone & pertahankan.
                        const { innermostId, outermostId } = cloneChainSlice(chain, 0, chain.length - 1, originalParentId, contents);

                        // Promosikan wrapper hasil clone: hapus content-nya
                        // supaya jadi pure container, bukan duplikat teks.
                        let cleanId = outermostId;
                        let guard = 0;
                        while (cleanId && guard++ < MAX_FIXPOINT_ITERATIONS) {
                            const n = findNode(cleanId, contents);
                            if (!n) break;
                            n.content = undefined;
                            const kids = Array.from(contents.values()).filter((c) => c.parent === cleanId);
                            cleanId = kids.length > 0 ? kids[0].id : null;
                        }

                        // Node format baru sebagai leaf di dalam clone paling dalam.
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
                        // Tidak ada wrapper leluhur → cukup leaf spanned biasa.
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
                            order: baseOrder,
                        });
                        contents.set(beforeText.id, beforeText);
                    }

                    if (hasAfter) {
                        const afterText = makeSpannedNode({
                            tagName: "span",
                            content: after,
                            parent: rootNode.id,
                            order: segIdx + baseOrder + ORDER_STEP,
                        });
                        contents.set(afterText.id, afterText);
                    }

                    if (selectedText.length > 0) {
                        const newFormatNode = makeSpannedNode({
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: rootNode.id,
                            order: baseOrder,
                        });
                        contents.set(newFormatNode.id, newFormatNode);
                    }
                    return;
                }

                if (targetNode.tagName === "span") {
                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    beforeNode.order = baseOrder + segIdx * ORDER_EPS;

                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    afterNode.order = baseOrder + ORDER_MAJOR + segIdx * ORDER_EPS;

                    if (hasBefore) contents.set(beforeNode.id, beforeNode);
                    if (hasAfter) contents.set(afterNode.id, afterNode);

                    if (selectedText.length > 0) {
                        const newFormatNode = makeSpannedNode({
                            tagName: formattedTagName,
                            content: selectedText,
                            parent: rootNode.id,
                            order: baseOrder + ORDER_EPS + segIdx * ORDER_EPS,
                        });
                        contents.set(newFormatNode.id, newFormatNode);
                        contents.delete(targetNode.id);
                    }
                } else {
                    const wrapper = targetNode.clone();
                    wrapper.content = undefined;

                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    beforeNode.order = baseOrder + segIdx * ORDER_EPS;
                    beforeNode.parent = wrapper.id;

                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    afterNode.order = baseOrder + ORDER_MAJOR + segIdx * ORDER_EPS;
                    afterNode.parent = wrapper.id;

                    const newFormatNode = makeSpannedNode({
                        tagName: formattedTagName,
                        content: selectedText,
                        parent: wrapper.id,
                        order: baseOrder + ORDER_EPS + segIdx * ORDER_EPS,
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

            // PERBAIKAN BUG: sebelumnya wrapper diambil dari `descendants`
            // (snapshot ASLI sebelum kloning), padahal seharusnya dari
            // `contents` (map yang sedang dimutasi di loop ini). Kalau ada
            // lebih dari satu segmen, lookup ke `descendants` bisa
            // mengembalikan node yang sudah usang/berbeda dari kondisi
            // terkini. `contents` tetap fallback ke rootNode bila parent
            // tidak ditemukan, supaya `wrapper` selalu terdefinisi.
            const wrapper: NodeModel = (originalParentId && contents.get(originalParentId)) || rootNode;

            contents.delete(targetNode.id);

            if (wrapper.id === rootNode.id) {
                if (hasBefore) {
                    const beforeNode = targetNode.clone();
                    beforeNode.content = before;
                    contents.set(beforeNode.id, beforeNode);
                }

                // Pertahankan teks SETELAH selection (tetap terformat).
                if (hasAfter) {
                    const afterNode = targetNode.clone();
                    afterNode.content = after;
                    afterNode.order = baseOrder + ORDER_STEP;
                    contents.set(afterNode.id, afterNode);
                }

                // Tangani teks yang TERPILIH (hapus format spesifiknya).
                if (selectedText.length > 0) {
                    const unformattedNode = makeSpannedNode({
                        tagName: "span", // atau tag dari parent berikutnya di rantai
                        content: selectedText,
                        parent: wrapper.id, // taruh di luar wrapper yang dihapus
                        order: baseOrder + ORDER_EPS,
                    });
                    contents.set(unformattedNode.id, unformattedNode);
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
                    afterNode.order = baseOrder + ORDER_STEP;
                    contents.set(afterNode.id, afterNode);
                }
                if (selectedText.length > 0) {
                    const unformattedNode = wrapper.clone();
                    unformattedNode.content = selectedText;
                    unformattedNode.parent = wrapper.id;
                    unformattedNode.order = baseOrder + ORDER_EPS;
                    contents.set(unformattedNode.id, unformattedNode);
                }
            }
        }
    });

    contents.delete(rootNode.id); // root cuma dipakai untuk keperluan lookup/pengukuran

    normalizeNodeOrders(contents);
    cleanupEmptyFormatNodes(contents);

    // 1. Gabungkan sibling dengan format yang identik persis.
    mergeAdjacentFormatNodes(contents);

    // 2. Ratakan nesting yang redundan: strong>strong, em>em, dst.
    mergeNestedFormatNodes(contents);

    // 3. Normalisasi rantai formatting yang setara:
    //    strong>em dan em>strong → hierarki kanonik yang sama.
    normalizeEquivalentFormatChains(contents);

    // 4. Gabungkan text node yang dipisahkan whitespace.
    normalizeNestedTextNodes(contents);
    mergeAdjacentFormatNodesWithWhitespace(contents);

    disableInteractions(contents);
    normalizeNodeOrders(contents);

    if (contents.size === 0) {
        console.warn("applyFormatted: semua node terhapus, update dibatalkan.");
        return undefined;
    }

    return contents;
}

const normalizeNestedTextNodes = (collections: Map<string, NodeModel>) => {
    // Catatan: struktur di sini bisa berubah selama traversal (anak
    // dipromosikan, node dihapus, lalu di-normalize ulang secara rekursif
    // untuk node yang sama). Karena itu index anak TIDAK di-cache lintas
    // pemanggilan `normalize()` — cukup dihitung ulang lewat helper kecil
    // ini, yang tetap jauh lebih murah daripada scan penuh + filter di
    // setiap tempat pemakaian.
    const getChildren = (parentId: string) =>
        Array.from(collections.values())
            .filter((node) => node.parent === parentId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const normalize = (node: NodeModel) => {
        if (!isMergeable(node)) return;

        let children = getChildren(node.id);
        for (const child of children) normalize(child);

        // Ambil ulang: rekursi di atas bisa saja mengubah daftar anak.
        children = getChildren(node.id);

        for (const child of children) {
            if (!isMergeable(child) || !areMergeableFormatTags(node.tagName, child.tagName)) continue;

            // Anak punya content sendiri → jangan dihapus begitu saja.
            if (child.content) continue;

            const grandchildren = getChildren(child.id);
            for (const grandchild of grandchildren) {
                grandchild.parent = node.id;
            }

            collections.delete(child.id);

            // Normalize ulang: hasil promosi bisa saja masih punya wrapper
            // redundan lain.
            normalize(node);
            return;
        }
    };

    const roots = Array.from(collections.values()).filter((node) => !node.parent || !collections.has(node.parent));

    for (const root of roots) normalize(root);
};

/**
 * Terapkan atau hapus `format` pada selection saat ini.
 *
 * Dibungkus try/catch: fungsi ini menggerakkan state editor yang live,
 * jadi kalau ada edge case tak terduga (rantai malformed, node hilang, dst)
 * seharusnya jatuh ke "no-op, log error" — bukan throw dan merusak editor
 * di tengah keystroke. Kalau sedang debug masalah formatting, cek console
 * untuk error "applyFormatted failed" terlebih dahulu.
 */
export const applyFormatted = (props: ApplyFormattedProps): Map<string, NodeModel> | undefined => {
    try {
        return applyFormattedInternal(props);
    } catch (err) {
        console.error("applyFormatted failed:", err);
        return undefined;
    }
};