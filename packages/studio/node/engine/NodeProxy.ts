import { Model } from "./Model";
import { Node } from "./Node";

export class NodeProxy {
    constructor(private model: Model<any, any>, private node: Node<any, any>) { }

    get(target: any, prop: string) {
        if (prop in target) {
            return target[prop];
        }
        if (prop in this.node.props) {
            return this.node.props[prop as keyof typeof this.node.props];
        }
        return undefined;
    }

    set(target: any, prop: string, value: any) {
        if (prop in target) {
            target[prop] = value;
            return true;
        }
        if (prop in this.node.props) {
            this.node.props[prop as keyof typeof this.node.props] = value;
            return true;
        }
        return false;
    }
}