import { RegistryKey } from "@nodes/types/type";
import { Model } from "./Model";
import { Node } from "./Node";

export class NodeProxy<T extends RegistryKey> implements ProxyHandler<Node<T>> {
    constructor(
        private node: Node<T>,
        private notifyChange: () => void
    ) { }

    get(target: Node<T>, prop: string) {
        const value = (target as any)[prop];
        if (typeof value === "function") {
            return value.bind(target);
        }
        if (prop in (this.node.data as object)) {
            return this.node.data[prop as keyof typeof this.node.data];
        }
        return value;
    }

    set(target: Node<T>, prop: string, value: any) {
        console.log(`Setting property ${prop} to`, value);
        if (prop in (this.node.data as object)) {
            this.node.data[prop as keyof typeof this.node.data] = value;
            this.notifyChange();
            return true;
        }
        (target as any)[prop] = value;
        return true;
    }
}