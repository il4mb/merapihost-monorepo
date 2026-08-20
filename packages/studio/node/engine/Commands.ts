import { RegistryKey } from "@nodes/types/type";
import { Node } from "./Node";
import { ModelCommands } from "./Model";

export class Commands<T extends RegistryKey = RegistryKey> implements ProxyHandler<ModelCommands<T>> {

    constructor(private node: Node<T>) { }
    get(target: ModelCommands<T>, prop: string) {
        const command = target[prop];
        if (command) {
            return command.bind(this.node);
        }
        return undefined;
    }
}