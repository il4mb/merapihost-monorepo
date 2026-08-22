import { transform, ColorType } from "@tbela99/css-parser/web";
import { Container } from "../Container";
import { Node } from "../node/Node";

export class Stylish {

    protected nodeStyles = new Map();
    protected element: HTMLStyleElement | null = null;

    protected cachedStyle = "";

    constructor(protected document: Container) { }

    async parseNodeStyle(node: Node) {
        const css = "body {color: red;};\n p {color: blue; };";
        const result = await transform(css, {
            beautify: false,
            convertColor: ColorType.RGB
        });

        console.log(result);
        this.cachedStyle = result.code;

        this.render();
    }

    getElement() {
        if (!this.element) {
            const doc = this.document.head.element?.ownerDocument;
            if (doc) {
                this.element = doc?.createElement("style");
                doc.head.append(this.element);
            }
        }
        return this.element;
    }

    render() {
        const element = this.getElement();
        if (element) {
            element.innerHTML = this.cachedStyle;
        }
    }

}