const TAG_FOR_COMMAND: Record<"bold" | "italic" | "underline", string> = {
    bold: "strong",
    italic: "em",
    underline: "u",
};

/** Finds the nearest ancestor (inclusive) matching tagName, bounded by `root`. */
const findAncestorTag = (node: Node, tagName: string, root: HTMLElement): HTMLElement | null => {
    let cur: Node | null = node;
    while (cur && cur !== root.parentNode) {
        if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).tagName.toLowerCase() === tagName) {
            return cur as HTMLElement;
        }
        cur = cur.parentNode;
    }
    return null;
};

/** Replaces `el` with its own children (unwrap), preserving surrounding siblings. */
const unwrapElement = (el: HTMLElement, doc: Document) => {
    const parent = el.parentNode;
    if (!parent) return;
    const frag = doc.createDocumentFragment();
    while (el.firstChild) frag.appendChild(el.firstChild);
    parent.replaceChild(frag, el);
};

/**
 * Toggles inline formatting (bold/italic/underline) on the current selection
 * within `root`, using real Range operations — no execCommand.
 *
 * Handles two cases:
 *  1. Selection start & end share a common ancestor of the target tag ->
 *     unwrap it (pure toggle-off, works when the whole selection sits
 *     inside one matching element).
 *  2. Otherwise -> wrap the extracted range contents in a new element.
 *
 * Note: this is a pragmatic implementation, not a full contentEditable
 * formatting engine (it won't split/merge partially-overlapping bold runs
 * the way execCommand's browser-native logic does). For a typical
 * "select text, hit Ctrl+B" flow it's correct and predictable.
 */
export const toggleInlineFormat = (root: HTMLElement, doc: Document, win: Window, command: "bold" | "italic" | "underline"): Range | null => {

    const selection = win.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return null; // nothing selected, nothing to toggle
    if (!root.contains(range.commonAncestorContainer)) return null;

    const tagName = TAG_FOR_COMMAND[command];

    // Case 1: whole selection already inside a single matching element.
    const startAncestor = findAncestorTag(range.startContainer, tagName, root);
    const endAncestor = findAncestorTag(range.endContainer, tagName, root);

    if (startAncestor && startAncestor === endAncestor) {
        // Toggle OFF: unwrap it, then reselect the same text.
        const text = startAncestor.textContent || "";
        const parent = startAncestor.parentNode;
        const index = parent ? Array.from(parent.childNodes).indexOf(startAncestor) : -1;
        unwrapElement(startAncestor, doc);

        if (parent && index >= 0) {
            const newRange = doc.createRange();
            // After unwrap, the unwrapped text nodes sit where the element was.
            const node = parent.childNodes[index];
            if (node) {
                newRange.selectNodeContents(node);
                return newRange;
            }
        }
        return null;
    }

    // Case 2: Toggle ON — extract & wrap.
    const extracted = range.extractContents();
    const wrapper = doc.createElement(tagName);
    wrapper.appendChild(extracted);
    range.insertNode(wrapper);

    const newRange = doc.createRange();
    newRange.selectNodeContents(wrapper);
    return newRange;
};