import type { INode, InferCommand } from "@/types";

export class Commands<T extends ModelName = ModelName> implements ProxyHandler<InferCommand<T>> {

    constructor(private node: INode<T>) { }
    get(target: InferCommand<T>, prop: string) {
        const command = target[prop];
        if (command) {
            return command.bind(this.node);
        }
        return undefined;
    }
}