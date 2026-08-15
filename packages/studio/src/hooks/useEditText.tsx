import { NodeModel } from "@/libs/node";
import { esES } from "@mui/x-date-pickers/locales";
import { RefObject, useCallback, useEffect, useRef } from "react";

type CustomSelection = {
    anchor: number;
    focus: number;
};

export type CaretControl = {
    svgRef: RefObject<SVGSVGElement>;
    selectionRef: RefObject<CustomSelection>;
    render: () => void;
    getOffsetFromPoint: (x: number, y: number) => number;
};

export type SelectionSegment = {
    node: NodeModel;
    globalStart: number;   // start offset in global text
    globalEnd: number;     // end offset in global text
    localStart: number;    // start offset inside this node's content
    localEnd: number;      // end offset inside this node's content
    isFull: boolean;       // true if entire node is selected
    isPartial: boolean;    // true if only part of node is selected
};

export const getSelectionSegments = (anchor: number, focus: number, descendantsMap: Map<string, NodeModel>): SelectionSegment[] => {
    const start = Math.min(anchor, focus);
    const end = Math.max(anchor, focus);
    if (start === end) return [];

    const textNodes = Array.from(descendantsMap.values())
        .filter((n) => n.type.name.toLowerCase() === "textnode")
        .sort((a, b) => {
            if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
            const cmp = a.dom.compareDocumentPosition(b.dom);
            if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return (a.order || 0) - (b.order || 0);
        });

    const segments: SelectionSegment[] = [];
    let globalPos = 0;

    for (const node of textNodes) {
        const len = (node.content || "").length;
        const nodeStart = globalPos;
        const nodeEnd = globalPos + len;

        // No overlap
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

/** Find first TEXT_NODE inside an element (deep) */
const getTextChild = (el: Node): Text | null => {
    const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    return (walker.nextNode() as Text) || null;
};

/** Sum text lengths of all text nodes strictly before target in document order */
const globalOffsetBeforeNode = (target: NodeModel, map: Map<string, NodeModel>): number => {
    const nodes = Array.from(map.values())
        .filter((n) => n.type.name.toLowerCase() === "textnode")
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

/** 
 * Map native DOM text node + offset back to our global offset.
 * CRITICAL: only matches text nodes, not format wrappers.
 */
const offsetFromNativeNode = (nativeNode: Node, nativeOffset: number, map: Map<string, NodeModel>): number => {
    // Only consider text nodes — format wrappers must NOT match
    const textNodes = Array.from(map.values()).filter(
        (n) => n.type.name.toLowerCase() === "textnode" && n.dom
    );

    let test: Node | null = nativeNode;
    while (test) {
        for (const node of textNodes) {
            if (!node.dom) continue;

            // Exact match: native node IS the text node model's dom
            if (node.dom === test) {
                return globalOffsetBeforeNode(node, map) + Math.min(nativeOffset, (node.content || "").length);
            }

            // Containment match: native node is inside this text node's rendered element
            if (node.dom.contains(test)) {
                const global = globalOffsetBeforeNode(node, map);

                // Walk from nativeNode up to node.dom, summing all previous siblings' text
                // This handles: textNode -> span -> strong -> ... -> node.dom
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

/** Robust caret rect: tries collapsed range → adjacent char → parent element */
const getCaretRect = (doc: Document, textNode: Text, offset: number, containerRect: DOMRect): { x: number; y: number; h: number } | null => {
    const range = doc.createRange();
    const len = textNode.textContent?.length || 0;
    const safeOff = Math.max(0, Math.min(offset, len));

    // Strategy 1: collapsed range at exact offset
    range.setStart(textNode, safeOff);
    range.collapse(true);
    let r = range.getBoundingClientRect();

    // Strategy 2: if empty (line ends / overflow:hidden), try previous char
    if ((!r.width && !r.height) && safeOff > 0) {
        range.setStart(textNode, safeOff - 1);
        range.setEnd(textNode, safeOff);
        r = range.getBoundingClientRect();
        if (r.width || r.height) {
            return {
                x: Math.round(r.right - containerRect.left),
                y: Math.round(r.top - containerRect.top),
                h: Math.round(r.height),
            };
        }
    }

    // Strategy 3: if still empty, try next char
    if ((!r.width && !r.height) && safeOff < len) {
        range.setStart(textNode, safeOff);
        range.setEnd(textNode, safeOff + 1);
        r = range.getBoundingClientRect();
        if (r.width || r.height) {
            return {
                x: Math.round(r.left - containerRect.left),
                y: Math.round(r.top - containerRect.top),
                h: Math.round(r.height),
            };
        }
    }

    // Strategy 4: use parent element box as last resort
    if (!r.width && !r.height) {
        const parent = textNode.parentElement;
        if (parent) {
            const pr = parent.getBoundingClientRect();
            return {
                x: Math.round(pr.left - containerRect.left),
                y: Math.round(pr.top - containerRect.top),
                h: Math.round(pr.height),
            };
        }
        return null;
    }

    return {
        x: Math.round(r.left - containerRect.left),
        y: Math.round(r.top - containerRect.top),
        h: Math.round(r.height),
    };
};

/** Merge selection rects that are on the same visual line AND horizontally adjacent */
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

    // Clamp
    if (offset < 0) offset = 0;
    if (offset > len) offset = len;

    // Word boundary chars: whitespace and common punctuation
    const isBoundary = (c: string) => /[\s\n\r\t.,;:!?()[\]{}'"\\/\-+=<>@#$%^&*|~`]/u.test(c);

    // Expand left to find start
    let start = offset;
    while (start > 0 && !isBoundary(fullText[start - 1])) {
        start--;
    }

    // Expand right to find end
    let end = offset;
    while (end < len && !isBoundary(fullText[end])) {
        end++;
    }

    return { start, end };
};

export const useCaretControl = (node: NodeModel, descendantsRef: RefObject<Map<string, NodeModel>>): CaretControl => {

    const svgRef = useRef<SVGSVGElement>(null);
    const selectionRef = useRef<CustomSelection>({ anchor: 0, focus: 0 });
    const isDraggingRef = useRef(false);

    const getTextNodes = useCallback(() => {
        return Array.from(descendantsRef.current.values())
            .filter((n) => n.type.name.toLowerCase() === "textnode")
            .sort((a, b) => {
                if (!a.dom || !b.dom) return (a.order || 0) - (b.order || 0);
                const cmp = a.dom.compareDocumentPosition(b.dom);
                if (cmp & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
                if (cmp & Node.DOCUMENT_POSITION_PRECEDING) return 1;
                return (a.order || 0) - (b.order || 0);
            });
    }, [descendantsRef]);

    const getOffsetFromPoint = useCallback((mouseX: number, mouseY: number): number => {
        if (!node.dom) return 0;
        const doc = node.dom.ownerDocument;

        // ── 1. Native read-only API (most accurate) ──
        if ("caretPositionFromPoint" in doc) {
            const pos = (doc as any).caretPositionFromPoint(mouseX, mouseY);
            if (pos) {
                return offsetFromNativeNode(pos.offsetNode, pos.offset, descendantsRef.current);
            }
        } else if ("caretRangeFromPoint" in doc) {
            const range = (doc as any).caretRangeFromPoint(mouseX, mouseY);
            if (range) {
                return offsetFromNativeNode(range.startContainer, range.startOffset, descendantsRef.current);
            }
        }

        // ── 2. Fallback: binary search using actual DOM ranges per text node ──
        const containerRect = node.dom.getBoundingClientRect();
        const relX = mouseX - containerRect.left;
        const relY = mouseY - containerRect.top;
        const textNodes = getTextNodes();

        for (const n of textNodes) {
            if (!n.dom) continue;
            const textChild = getTextChild(n.dom);
            if (!textChild) continue;

            const range = doc.createRange();
            const len = textChild.textContent?.length || 0;
            const elRect = n.dom.getBoundingClientRect();

            // Quick vertical reject
            if (relY < elRect.top - containerRect.top || relY > elRect.bottom - containerRect.top) {
                continue;
            }

            let low = 0, high = len;
            while (low < high) {
                const mid = Math.floor((low + high) / 2);
                range.setStart(textChild, mid);
                range.collapse(true);
                const r = range.getBoundingClientRect();
                if (r.left - containerRect.left < relX) low = mid + 1;
                else high = mid;
            }

            const global = globalOffsetBeforeNode(n, descendantsRef.current);
            if (low === 0) return global;

            // Snap to nearest boundary
            range.setStart(textChild, low - 1);
            range.collapse(true);
            const leftR = range.getBoundingClientRect();

            range.setStart(textChild, low);
            range.collapse(true);
            const rightR = range.getBoundingClientRect();

            const distLeft = Math.abs(relX - (leftR.left - containerRect.left));
            const distRight = Math.abs(relX - (rightR.left - containerRect.left));

            return global + (distLeft <= distRight ? low - 1 : low);
        }

        let total = 0;
        for (const n of textNodes) total += (n.content || "").length;
        return total;
    }, [node.dom, getTextNodes, descendantsRef]);

    const render = useCallback(() => {
        const svg = svgRef.current;
        const container = node.dom;
        if (!svg || !container) return;

        while (svg.lastChild) svg.removeChild(svg.lastChild);

        const selection = selectionRef.current;
        const selStart = Math.min(selection.anchor, selection.focus);
        const selEnd = Math.max(selection.anchor, selection.focus);
        const hasRange = selStart !== selEnd;

        const textNodes = getTextNodes();
        const doc = container.ownerDocument;
        const containerRect = container.getBoundingClientRect();

        // ── SELECTION: build one range PER text node ──
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
                for (let i = 0; i < nodeRects.length; i++) {
                    allRects.push(nodeRects[i]);
                }
            }

            const merged = mergeRectsByLine(allRects, containerRect);
            for (const r of merged) {
                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

                // Inflate the rect slightly for better breathing room around text
                const padding = 1;
                rect.setAttribute("x", String(r.x - padding));
                rect.setAttribute("y", String(r.y - padding));
                rect.setAttribute("width", String(r.w + padding * 2));
                rect.setAttribute("height", String(r.h + padding * 2));

                // Modern styling: Softer radius, blend mode, and smooth transition
                rect.setAttribute("rx", "4");
                rect.setAttribute("fill", "rgba(0, 115, 255, 0.2)"); // Standard modern soft blue
                rect.setAttribute("style", "mix-blend-mode: multiply; transition: all 0.1s ease-out;");

                svg.appendChild(rect);
            }
        }

        // ── CARET: find text node + local offset, then measure robustly ──
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

                    // Modern caret styling: rounded caps, slightly thicker
                    line.setAttribute("stroke", "#0073ff");
                    line.setAttribute("stroke-width", "2");
                    line.setAttribute("stroke-linecap", "round");
                    line.setAttribute("style", "transition: all 0.05s ease-out;"); // Smooth movement between keystrokes

                    // Modern animation: Smooth sine-like fade instead of discrete jumping
                    const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
                    animate.setAttribute("attributeName", "opacity");
                    animate.setAttribute("values", "1;0;1");
                    animate.setAttribute("dur", "1.2s"); // Slightly slower cycle
                    animate.setAttribute("keyTimes", "0;0.5;1");
                    animate.setAttribute("repeatCount", "indefinite");
                    // Removed calcMode="discrete" to allow smooth interpolation

                    line.appendChild(animate);
                    svg.appendChild(line);
                }
            }
        }

        svg.setAttribute("height", String(container.scrollHeight));
    }, [node.dom, getTextNodes]);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        e.preventDefault(); // stop native selection always

        const offset = getOffsetFromPoint(e.clientX, e.clientY);
        const textNodes = getTextNodes();

        // ── Triple click: select entire line ──
        if (e.detail === 3) {
            const fullText = textNodes.map((n) => n.content || "").join("");
            let lineStart = offset;
            while (lineStart > 0 && fullText[lineStart - 1] !== "\n") lineStart--;
            let lineEnd = offset;
            while (lineEnd < fullText.length && fullText[lineEnd] !== "\n") lineEnd++;

            selectionRef.current = { anchor: lineStart, focus: lineEnd };
            isDraggingRef.current = false; // don't start drag
            render();
            return;
        }

        // ── Double click: select word ──
        if (e.detail === 2) {
            const { start, end } = getWordBounds(offset, textNodes);
            selectionRef.current = { anchor: start, focus: end };
            isDraggingRef.current = false;
            render();
            return;
        }

        // ── Single click: place caret, start drag ──
        selectionRef.current = { anchor: offset, focus: offset };
        isDraggingRef.current = true;
        render();
    }, [getOffsetFromPoint, getTextNodes, render]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current) return;
        selectionRef.current.focus = getOffsetFromPoint(e.clientX, e.clientY);
        render();
    }, [getOffsetFromPoint, render]);

    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
    }, []);

    const handleDoubleClick = useCallback((e: MouseEvent) => {
        e.preventDefault(); // Stop native browser selection
        e.stopPropagation();
        const clickOffset = getOffsetFromPoint(e.clientX, e.clientY);
        const textNodes = getTextNodes();
        const { start, end } = getWordBounds(clickOffset, textNodes);

        selectionRef.current = { anchor: start, focus: end };
        render();
    }, [getOffsetFromPoint, getTextNodes, render]);

    // Attach to window so dragging outside the box still works
    useEffect(() => {
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
    }, [node.dom, handleMouseDown, handleMouseMove, handleMouseUp]);

    return {
        svgRef,
        selectionRef,
        render,
        getOffsetFromPoint,
    };
};