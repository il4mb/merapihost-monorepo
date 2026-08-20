import { RegistryKey } from "@nodes/types/type";
import { Node } from "./Node";

export class NodeFiber {
    constructor(
        public node?: Node<RegistryKey>) {

    }
}