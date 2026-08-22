import type { Container } from "./Container";
import { EventEmitter } from "./EventEmitter";
import type { Node } from "./node/Node";

type InteractiveEventMap = {
    dragging: () => void;
    pressed: () => void;
    pointer: () => void;
}

export class Gesture extends EventEmitter<InteractiveEventMap> {

    protected state = {
        pressed: false,
        dragging: false,
        pointer: { x: 0, y: 0 }
    }

    get document() {
        return this.container.body.element?.ownerDocument;
    }

    get isPressed() {
        return this.state.pressed;
    }

    get isDragging() {
        return this.state.dragging;
    }

    constructor(protected container: Container) {
        super();
        container.body.on("mounted", (body) => {
            body.parentElement.addEventListener("mouseenter", (e) => this.onMouseEnter(e), true);
            body.parentElement.addEventListener("mouseleave", (e) => this.onMouseLeave(e), true);
            body.parentElement.addEventListener("mousedown", (e) => this.onMouseDown(e), true);
            body.parentElement.addEventListener("mouseup", (e) => this.onMouseUp(e), true);
            body.parentElement.addEventListener("mousemove", (e) => this.onMouseMove(e), true);
        });
    }



    protected onMouseEnter(e: MouseEvent) {
        if (this.state.dragging) return;
        const target = e.target as HTMLElement;
        const node = this.findAncestorNode(target);
        if (node) node.hovered = true;
        this.clearHovered(node);
    }

    protected onMouseLeave(e: MouseEvent) {
        if (this.state.dragging) return;
        const target = e.target as HTMLElement;
        const node = this.findAncestorNode(target);
        if (node) node.hovered = false;
        this.clearHovered(node);
    }

    protected onMouseDown(e: MouseEvent) {
        this.state.pressed = true;
        const target = e.target as HTMLElement;
        const node = this.findAncestorNode(target);
        if (node) node.selected = true;
        this.clearSelected(node);
    }

    protected onMouseUp(e: MouseEvent) {
        if (this.isDragging) {
            console.log("Cleanup Dragging");
            this.clearHovered();
        }
        this.state.pressed = false;
        this.state.dragging = false;
    }

    protected onMouseMove(e: MouseEvent) {
        this.state.pointer = { x: e.clientX, y: e.clientY };
        const dragging = this.isDragging;
        if (!dragging && this.isPressed) {
            this.state.dragging = true;
            this.clearSelection();
        }
        if (dragging) {
            console.log("Dragging");
        }
    }

    /**
     * Clear Window Selection
     */
    protected clearSelection() {
        const win = this.document?.defaultView;
        if (win.getSelection) {
            win.getSelection().removeAllRanges();
        } else if (this.document && Object.hasOwn(this.document, 'selection')) {
            // @ts-ignore
            this.document.selection.empty(); // Old IE support
        }
    }

    /***
     * Clear Hover all node that not at the pointer
     */
    private clearHovered(...exclude: Node[]) {
        const focus = this.document.elementFromPoint(
            this.state.pointer.x,
            this.state.pointer.y
        );
        if (focus) {
            const focusNode = this.findByElement(focus);
            if (!exclude.includes(focusNode)) {
                exclude.push(focusNode);
            }
        }
        this.container.nodes.forEach(n => {
            if (!exclude.includes(n)) {
                n.hovered = false;
            }
        })
    }

    private clearSelected(...exclude: Node[]) {
        this.container.nodes.forEach(n => {
            if (!exclude.includes(n)) {
                n.selected = false;
            }
        })
    }

    private findAncestorNode(element: Element) {
        let current: Element | null = element;
        while (current) {
            const node = this.findByElement(current);
            if (node) return node;
            current = current.parentElement;
        }
        return null;
    }

    private findByElement(element: Element) {
        const arrayNodes = Array.from(this.container.nodes.values());
        return arrayNodes.find(n => n.element === element);;
    }
}