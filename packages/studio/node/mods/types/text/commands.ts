import { CommandDefinition } from "@nodes/types/type";

export const commands: CommandDefinition<"text"> = {
    test() {
        this.props.text = "Hello, World!";
    }
}