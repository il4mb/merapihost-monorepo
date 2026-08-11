import type { LayoutBoxes, Viewport } from "@/types";

export const getLayoutBoxes = (element: HTMLElement, viewport: Viewport): LayoutBoxes | null => {
    const { x: scrollX, y: scrollY } = viewport.scroll;
    const rectList = Array.from(element.getClientRects());
    if (rectList.length === 0) return null;

    const style = window.getComputedStyle(element);

    // 1. Calculate overall Border Box from client rects
    const bTop = Math.min(...rectList.map(r => r.top));
    const bLeft = Math.min(...rectList.map(r => r.left));
    const bBottom = Math.max(...rectList.map(r => r.bottom));
    const bRight = Math.max(...rectList.map(r => r.right));

    // Apply viewport edge offset and scroll position
    const borderBox = {
        top: viewport.edge.top + bTop + scrollY,
        left: viewport.edge.left + bLeft + scrollX,
        bottom: viewport.edge.top + bBottom + scrollY,
        right: viewport.edge.left + bRight + scrollX,
    };

    // 2. Parse CSS values
    const parseVal = (val: string) => (parseFloat(val) || 0);

    const bt = parseVal(style.borderTopWidth);
    const br = parseVal(style.borderRightWidth);
    const bb = parseVal(style.borderBottomWidth);
    const bl = parseVal(style.borderLeftWidth);

    const pt = parseVal(style.paddingTop);
    const pr = parseVal(style.paddingRight);
    const pb = parseVal(style.paddingBottom);
    const pl = parseVal(style.paddingLeft);

    const mt = parseVal(style.marginTop);
    const mr = parseVal(style.marginRight);
    const mb = parseVal(style.marginBottom);
    const ml = parseVal(style.marginLeft);

    // 3. Calculate Padding Box (Border Box minus Border Widths)
    const paddingBox = {
        top: borderBox.top + bt,
        left: borderBox.left + bl,
        bottom: borderBox.bottom - bb,
        right: borderBox.right - br,
    };

    // 4. Calculate Content Box (Padding Box minus Padding Widths)
    const contentBox = {
        top: paddingBox.top + pt,
        left: paddingBox.left + pl,
        bottom: paddingBox.bottom - pb,
        right: paddingBox.right - pr,
    };

    // 5. Calculate Margin Box (Border Box plus Margins)
    const marginBox = {
        top: borderBox.top - mt,
        left: borderBox.left - ml,
        bottom: borderBox.bottom + mb,
        right: borderBox.right + mr,
    };

    return { margin: marginBox, border: borderBox, padding: paddingBox, content: contentBox };
};