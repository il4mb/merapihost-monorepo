
import { Node } from "@nodes/engine";
import { CommandDefinition } from "@nodes/types/type";

export const commands: CommandDefinition<"text"> = {
    test(text) {
        console.log(`${text} from ${this.type} node`);
    },

    toggleEditing() {
        this.children.forEach(n => {
            n.hoverable = Boolean(this.data.editing);
            n.selectable = Boolean(this.data.editing);
        });
        this.data.editing = !this.data.editing;
    },

    makeSpanned() {
        return this.owner.createNode("text", {
            tagName: "span",
            parent: this.id,
            data: {
                text: "This is Span Created By Text Model"
            }
        });
    },



    format(tagName, selection) {
        if (!this.data.editing) return;

        throw new Error("Function not implemented.");
    },

}