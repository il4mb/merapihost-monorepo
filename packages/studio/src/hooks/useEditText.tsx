import { NodeModel } from "@/libs/node";
import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { useMutateNodeData } from "./useNodes";
import { TextTypeData } from "@/libs/node/types/text/TextType";
import { getTextNodes, Selection } from "@/libs/node/types/text/tools";

type CustomSelection = { anchor: number; focus: number };

export type CaretControl = {
    svgRef: RefObject<SVGSVGElement>;
    selectionRef: RefObject<CustomSelection>;
    activeFormatsRef: RefObject<string[]>; // ← NEW: live format state for toolbar
    render: () => void;
    getOffsetFromPoint: (x: number, y: number) => number;
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

const getSelectionSegments = (anchor: number, focus: number, descendantsMap: Map<string, NodeModel>, rootNode: NodeModel): SelectionSegment[] => {
    const start = Math.min(anchor, focus);
    const end = Math.max(anchor, focus);
    if (start === end) return [];

    const textNodes = getTextNodes(descendantsMap, rootNode);
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

/** compute active format tags for toolbar state ── */
const computeActiveFormats = (selection: CustomSelection, descendantsMap: Map<string, NodeModel>, rootNode: NodeModel): string[] => {
    // ── Collect text nodes dengan arsitektur baru ──
    const allNodes = Array.from(descendantsMap.values());

    const textNodes = allNodes.filter((n) => n.type.isText).sort((a, b) => {
        if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
        const cmp = a.dom.compareDocumentPosition(b.dom);
        if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return (a.order || 0) - (b.order || 0);
    });

    // Jika root punya content string, root juga masuk
    if (rootNode && typeof rootNode.content === 'string') {
        textNodes.unshift(rootNode);
    }

    /** Walk up parent chain collecting formatted tagNames */
    const getFormatTags = (node: NodeModel): string[] => {
        const tags: string[] = [];
        let currentId: string | null | undefined = node.parent;
        while (currentId && currentId !== rootNode.id) {
            const parent = descendantsMap.get(currentId);
            if (!parent) break;
            if (parent.type.name.toLowerCase() === "formatted" && parent.tagName) {
                tags.push(parent.tagName.toLowerCase());
            }
            currentId = parent.parent;
        }
        return tags;
    };

    // ── Collapsed caret: return formats wrapping the caret position ──
    if (selection.anchor === selection.focus) {
        let globalPos = 0;
        let caretNode: NodeModel | null = null;
        for (const n of textNodes) {
            const len = (n.content || "").length;
            if (selection.focus >= globalPos && selection.focus <= globalPos + len) {
                caretNode = n;
                break;
            }
            globalPos += len;
        }
        return caretNode ? getFormatTags(caretNode) : [];
    }

    // ── Range selection: return ONLY formats that wrap EVERY selected segment ──
    const segments = getSelectionSegments(selection.anchor, selection.focus, descendantsMap, rootNode);
    if (segments.length === 0) return [];

    // Build a Set of format tags for each segment
    const segmentTagSets = segments.map((seg) => new Set(getFormatTags(seg.node)));

    // Intersection: tags present in ALL segments (fully covers selection)
    const [first, ...rest] = segmentTagSets;
    const active: string[] = [];
    for (const tag of first) {
        if (rest.every((set) => set.has(tag))) {
            active.push(tag);
        }
    }
    return active;
};

const getTextChild = (el: Node): Text | null => {
    const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    return (walker.nextNode() as Text) || null;
};

const globalOffsetBeforeNode = (target: NodeModel, map: Map<string, NodeModel>): number => {
    const nodes = Array.from(map.values())
        .filter((n) => n.type.isText)
        .sort((a, b) => {
            if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
            const cmp = a.dom.compareDocumentPosition(b.dom);
            if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return (a.order || 0) - (b.order || 0);
        });
    let off = 0;
    for (const n of nodes) {
        if (n.id === target.id) return off;
        off += (n.content || "").length;
    }
    return off;
};

const offsetFromNativeNode = (nativeNode: Node, nativeOffset: number, map: Map<string, NodeModel>): number => {
    const textNodes = Array.from(map.values());//.filter((n) => n.type.isText && n.dom);

    let test: Node | null = nativeNode;
    while (test) {
        for (const node of textNodes) {
            if (!node.dom) continue;
            if (node.dom === test) {
                return globalOffsetBeforeNode(node, map) + Math.min(nativeOffset, (node.content || "").length);
            }
            if (node.dom.contains(test)) {
                const global = globalOffsetBeforeNode(node, map);
                let adj = 0;
                let walk: Node | null = nativeNode;
                while (walk && walk !== node.dom) {
                    let sib: Node | null = walk.previousSibling;
                    while (sib) {
                        adj += sib.textContent?.length || 0;
                        sib = sib.previousSibling;
                    }
                    walk = walk.parentNode;
                }
                return global + Math.min(adj + nativeOffset, (node.content || "").length);
            }
        }
        test = test.parentNode;
    }
    return 0;
};

const getCaretRect = (doc: Document, textNode: Text, offset: number, containerRect: DOMRect): { x: number; y: number; h: number } | null => {
    const range = doc.createRange();
    const len = textNode.textContent?.length || 0;
    const safeOff = Math.max(0, Math.min(offset, len));

    range.setStart(textNode, safeOff);
    range.collapse(true);
    let r = range.getBoundingClientRect();

    if ((!r.width && !r.height) && safeOff > 0) {
        range.setStart(textNode, safeOff - 1);
        range.setEnd(textNode, safeOff);
        r = range.getBoundingClientRect();
        if (r.width || r.height) {
            return { x: Math.round(r.right - containerRect.left), y: Math.round(r.top - containerRect.top), h: Math.round(r.height) };
        }
    }

    if ((!r.width && !r.height) && safeOff < len) {
        range.setStart(textNode, safeOff);
        range.setEnd(textNode, safeOff + 1);
        r = range.getBoundingClientRect();
        if (r.width || r.height) {
            return { x: Math.round(r.left - containerRect.left), y: Math.round(r.top - containerRect.top), h: Math.round(r.height) };
        }
    }

    if (!r.width && !r.height) {
        const parent = textNode.parentElement;
        if (parent) {
            const pr = parent.getBoundingClientRect();
            return { x: Math.round(pr.left - containerRect.left), y: Math.round(pr.top - containerRect.top), h: Math.round(pr.height) };
        }
        return null;
    }

    return { x: Math.round(r.left - containerRect.left), y: Math.round(r.top - containerRect.top), h: Math.round(r.height) };
};

const mergeRectsByLine = (rawRects: DOMRectList | DOMRect[], containerRect: DOMRect): Array<{ x: number; y: number; w: number; h: number }> => {
    const rects = Array.from(rawRects).map((r) => ({
        x: Math.round(r.left - containerRect.left),
        y: Math.round(r.top - containerRect.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
    }));

    const valid = rects.filter((r) => r.w > 0 && r.h > 0);
    if (valid.length === 0) return [];

    valid.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

    const merged: typeof valid = [];
    let current = valid[0];

    for (let i = 1; i < valid.length; i++) {
        const r = valid[i];
        const sameLine = Math.abs(r.y - current.y) <= 2 && Math.abs(r.h - current.h) <= 2;
        const gap = r.x - (current.x + current.w);

        if (sameLine && gap < 10) {
            current.w = r.x + r.w - current.x;
        } else {
            merged.push(current);
            current = r;
        }
    }
    merged.push(current);
    return merged;
};

const getWordBounds = (offset: number, textNodes: NodeModel[]): { start: number; end: number } => {
    const fullText = textNodes.map((n) => n.content || "").join("");
    const len = fullText.length;
    if (offset < 0) offset = 0;
    if (offset > len) offset = len;

    const isBoundary = (c: string) => /[\s\n\r\t.,;:!?()[\]{}'"\\/\-+=<>@#$%^&*|~`]/u.test(c);

    let start = offset;
    while (start > 0 && !isBoundary(fullText[start - 1])) start--;

    let end = offset;
    while (end < len && !isBoundary(fullText[end])) end++;

    return { start, end };
};

export const useCaretControl = (node: NodeModel<TextTypeData>, descendantsRef: RefObject<Map<string, NodeModel>>): CaretControl => {
    const mutate = useMutateNodeData(node);
    const svgRef = useRef<SVGSVGElement>(null);
    const selectionRef = useRef<Selection>({ anchor: 0, focus: 0 });
    const activeFormatsRef = useRef(node.data.formats);
    const isDraggingRef = useRef(false);

    const nodeRef = useRef(node);
    useEffect(() => {
        nodeRef.current = node;
    }, [node])

    const getOffsetFromPoint = useCallback((mouseX: number, mouseY: number): number => {
        const node = nodeRef.current;
        if (!node.dom) return 0;
        const doc = node.dom.ownerDocument;

        // 1. Restricted Native API call
        if (!node.isTextLeaf) {
            if ("caretPositionFromPoint" in doc) {
                const pos = (doc as any).caretPositionFromPoint(mouseX, mouseY);
                if (pos?.offsetNode) return offsetFromNativeNode(pos.offsetNode, pos.offset, descendantsRef.current);
            } else if ("caretRangeFromPoint" in doc) {
                const range = (doc as any).caretRangeFromPoint(mouseX, mouseY);
                if (range?.startContainer) return offsetFromNativeNode(range.startContainer, range.startOffset, descendantsRef.current);
            }
        }

        // 2. Multi-line aware Binary Search for Text Leaves
        const textChild = node.dom.firstChild?.nodeType === Node.TEXT_NODE ? node.dom.firstChild as Text : null;
        if (!textChild) return 0;

        const len = textChild.textContent?.length || 0;
        if (len === 0) return 0;

        const range = doc.createRange();
        let low = 0;
        let high = len;

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            range.setStart(textChild, mid);
            range.collapse(true);
            const r = range.getBoundingClientRect();

            // Check Y coordinate first (Row detection)
            if (mouseY > r.bottom) {
                // Mouse is below this line, move forward
                low = mid + 1;
            } else if (mouseY < r.top) {
                // Mouse is above this line, move backward
                high = mid;
            } else {
                // Mouse is on the same row, now check X coordinate
                if (mouseX > r.left) {
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
        }

        // 3. Final Boundary Resolution
        const targetLeft = Math.max(0, low - 1);
        const targetRight = Math.min(len, low);

        range.setStart(textChild, targetLeft);
        range.collapse(true);
        const leftRect = range.getBoundingClientRect();

        range.setStart(textChild, targetRight);
        range.collapse(true);
        const rightRect = range.getBoundingClientRect();

        // Check if the boundaries crossed a line break (word wrap)
        const isLeftOnLine = mouseY >= leftRect.top && mouseY <= leftRect.bottom;
        const isRightOnLine = mouseY >= rightRect.top && mouseY <= rightRect.bottom;

        if (isLeftOnLine && !isRightOnLine) return targetLeft;
        if (isRightOnLine && !isLeftOnLine) return targetRight;

        // If both are on the same row (or both off), pick the closest X
        const distLeft = Math.abs(mouseX - leftRect.left);
        const distRight = Math.abs(mouseX - rightRect.left);

        return distLeft <= distRight ? targetLeft : targetRight;
    }, [descendantsRef]); // getTextNodes removed as it's unused


    const render = useCallback(() => {
        const node = nodeRef.current;
        const svg = svgRef.current;
        const container = node.dom;
        if (!svg || !container) return;

        // ── NEW: recompute active formats every render ──
        activeFormatsRef.current = computeActiveFormats(
            selectionRef.current,
            descendantsRef.current,
            node
        );

        while (svg.lastChild) svg.removeChild(svg.lastChild);

        const selection = selectionRef.current;
        const selStart = Math.min(selection.anchor, selection.focus);
        const selEnd = Math.max(selection.anchor, selection.focus);
        const hasRange = selStart !== selEnd;

        const textNodes = getTextNodes(descendantsRef.current, node);
        const doc = container.ownerDocument;
        const containerRect = container.getBoundingClientRect();

        if (hasRange) {
            const allRects: DOMRect[] = [];
            let pos = 0;

            for (const n of textNodes) {
                const len = (n.content || "").length;
                const nodeStart = pos;
                const nodeEnd = pos + len;
                pos += len;

                const overlapStart = Math.max(selStart, nodeStart);
                const overlapEnd = Math.min(selEnd, nodeEnd);

                if (overlapStart >= overlapEnd) continue;
                if (!n.dom) continue;

                const textChild = getTextChild(n.dom);
                if (!textChild) continue;

                const localStart = overlapStart - nodeStart;
                const localEnd = overlapEnd - nodeStart;

                const range = doc.createRange();
                range.setStart(textChild, Math.min(localStart, textChild.textContent?.length || 0));
                range.setEnd(textChild, Math.min(localEnd, textChild.textContent?.length || 0));

                const nodeRects = range.getClientRects();
                for (let i = 0; i < nodeRects.length; i++) allRects.push(nodeRects[i]);
            }

            const merged = mergeRectsByLine(allRects, containerRect);
            for (const r of merged) {
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                rect.setAttribute("x", String(r.x - 1));
                rect.setAttribute("y", String(r.y - 1));
                rect.setAttribute("width", String(r.w + 2));
                rect.setAttribute("height", String(r.h + 2));
                rect.setAttribute("rx", "4");
                rect.setAttribute("fill", "rgba(0, 115, 255, 0.2)");
                rect.setAttribute("style", "mix-blend-mode: multiply;");
                svg.appendChild(rect);
            }
        }

        let caretGlobal = 0;
        let caretNode: NodeModel | null = null;
        let caretLocal = 0;

        for (const n of textNodes) {
            const len = (n.content || "").length;
            if (selection.focus >= caretGlobal && selection.focus <= caretGlobal + len) {
                caretNode = n;
                caretLocal = selection.focus - caretGlobal;
                break;
            }
            caretGlobal += len;
        }

        if (caretNode?.dom) {
            const textChild = getTextChild(caretNode.dom);
            if (textChild) {
                const caretRect = getCaretRect(doc, textChild, caretLocal, containerRect);
                if (caretRect) {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", String(caretRect.x));
                    line.setAttribute("y1", String(caretRect.y));
                    line.setAttribute("x2", String(caretRect.x));
                    line.setAttribute("y2", String(caretRect.y + caretRect.h));
                    line.setAttribute("stroke", "#0073ff");
                    line.setAttribute("stroke-width", "2");
                    line.setAttribute("stroke-linecap", "round");

                    const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
                    animate.setAttribute("attributeName", "opacity");
                    animate.setAttribute("values", "1;0;1");
                    animate.setAttribute("dur", "1.2s");
                    animate.setAttribute("keyTimes", "0;0.5;1");
                    animate.setAttribute("repeatCount", "indefinite");
                    line.appendChild(animate);
                    svg.appendChild(line);
                }
            }
        }

        svg.setAttribute("height", String(container.scrollHeight));
        mutate({ formats: activeFormatsRef.current })
    }, [descendantsRef, mutate]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        e.preventDefault();
        const offset = getOffsetFromPoint(e.clientX, e.clientY);
        const textNodes = getTextNodes(descendantsRef.current, node);

        if (e.detail === 3) {
            const fullText = textNodes.map((n) => n.content || "").join("");
            let lineStart = offset;
            while (lineStart > 0 && fullText[lineStart - 1] !== "\n") lineStart--;
            let lineEnd = offset;
            while (lineEnd < fullText.length && fullText[lineEnd] !== "\n") lineEnd++;
            selectionRef.current = { anchor: lineStart, focus: lineEnd };
            isDraggingRef.current = false;
            render();
            return;
        }

        if (e.detail === 2) {
            const { start, end } = getWordBounds(offset, textNodes);
            selectionRef.current = { anchor: start, focus: end };
            isDraggingRef.current = false;
            render();
            return;
        }

        selectionRef.current = { anchor: offset, focus: offset };
        isDraggingRef.current = true;
        render();
    }, [getOffsetFromPoint, render]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        selectionRef.current.focus = getOffsetFromPoint(e.clientX, e.clientY);
        render();
    }, [getOffsetFromPoint, render]);

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
    }, []);

    useEffect(() => {
        const node = nodeRef.current;
        if (!node.dom) return;
        const win = node.dom.ownerDocument.defaultView;
        node.dom.addEventListener("mousedown", handleMouseDown);
        win.addEventListener("mousemove", handleMouseMove);
        win.addEventListener("mouseup", handleMouseUp);
        return () => {
            node.dom.removeEventListener("mousedown", handleMouseDown);
            win.removeEventListener("mousemove", handleMouseMove);
            win.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseDown, handleMouseMove, handleMouseUp]);

    return useMemo(() => ({
        svgRef, selectionRef, activeFormatsRef, render, getOffsetFromPoint,
    }), [render, getOffsetFromPoint]);
};