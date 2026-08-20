
import { CommandDefinition } from "@nodes/types/type";

export const commands: CommandDefinition<"text"> = {
    test(text) {
        console.log(`${text} from ${this.type} node`);
    }
}