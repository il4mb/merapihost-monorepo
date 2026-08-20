import { CommandDefinition, RegistryKey } from "@nodes/types/type";
import { Model } from "./Model";
import { Node } from "./Node";
import { GetNode } from "@nodes/types/node";

export class Commands<
    T extends RegistryKey = RegistryKey,
    C extends CommandDefinition<T> = CommandDefinition<T>,
> implements ProxyHandler<C> {

    constructor(private node: Node<T, any, C>) {

    }


    get(target: C, prop: string) {

        if (prop in target) {
            return target[prop as keyof C];
        }
        const command = this.node.model.commands[prop as keyof C];
        if (command) {
            return command.bind(this.node);
        }
        return undefined;
    }
}