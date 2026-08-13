import { BinaryIcon } from "lucide-react";
import { createType } from "../tools";
import { Fragment } from "react";

/***
* TextNode is a type for raw text content. It is used to represent text nodes in the DOM.
*/
export const TextNodeType = createType(({ node }) => {
    return (
        <Fragment>
            {node.content}
        </Fragment>
    );
}, {
    name: "TextNode",
    icon: BinaryIcon,
    draggable: true, // TextNode can be dragged
    droppable: ["Text"], // TextNode can only drop to Text type nodes
    accepts: [], // TextNode cannot accept any children
    default: {
        name: "textnode"
    }
});