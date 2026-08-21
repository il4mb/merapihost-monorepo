import { CommandDefinition, RegistryKey } from "@nodes/types/type";
import { Node } from "./Node";

export class Commands<T extends RegistryKey = RegistryKey> implements ProxyHandler<CommandDefinition<T>> {

    constructor(private node: Node<T>) { }
    get(target: CommandDefinition<T>, prop: string) {
        const command = target[prop];
        if (command) {
            return command.bind(this.node);
        }
        return undefined;
    }
}