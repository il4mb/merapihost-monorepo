
import { Document } from "../node/react";
import { describe, it, expectTypeOf } from "vitest";

describe("strict type checking", () => {
    const document = new Document();
    const textNode = document.createNode("text", { tagName: "div" });

    const testCommand = textNode.commands.test;
    console.log("testCommand", testCommand);

    it("should have correct types for text node", () => {
        expectTypeOf(textNode.props).toEqualTypeOf<{ text: string }>();
    });
});



// describe("document", () => {
//     it("should initialize with head and body nodes", () => {
//         const document = new Document();
//         const headNode = document.findNodes(n => n.tagName == "head");
//         const bodyNode = document.findNodes(n => n.tagName == "body");
//         expect(headNode.length).toBe(1);
//         expect(bodyNode.length).toBe(1);
//     });

//     it("should cannot add another head or body node", () => {
//         const document = new Document();
//         const headNode = document.createNode("text", { tagName: 'head' });
//         const bodyNode = document.createNode("element", { tagName: 'body' });

//         expectTypeOf(headNode).toEqualTypeOf<InferModelNode<"text">>();

//         expect(() => document.addNode(headNode)).toThrow("Node with tagName 'head' already exists");
//         expect(() => document.addNode(bodyNode)).toThrow("Node with tagName 'body' already exists");
//     });

//     it("should cannot remove head or body node", () => {
//         const document = new Document();
//         expect(() => document.removeNode("head")).toThrow("Cannot remove node 'head' or 'body'");
//         expect(() => document.removeNode("body")).toThrow("Cannot remove node 'head' or 'body'");
//     });

//     it("appendChild and removeChild should work correctly", () => {
//         const document = new Document();
//         const parentNode = document.createNode("element", { tagName: 'div' });
//         const childNode = document.createNode("element", { tagName: 'span' });

//         document.addNode(parentNode);
//         parentNode.appendChild(childNode);

//         expect(childNode.parent).toBe(parentNode);
//         expect(document.getNode(childNode.id)).toBeDefined();

//         parentNode.removeChild(childNode);
//         expect(childNode.parent).toBeNull();
//         expect(document.getNode(childNode.id)).toBeUndefined();
//     });

//     it("should add and remove nodes correctly", () => {
//         const document = new Document();
//         const newNode = document.createNode("element", { tagName: 'div' });
//         document.addNode(newNode);
//         expect(document.getNode(newNode.id)).toBeDefined();

//         document.removeNode(newNode.id);
//         expect(document.getNode(newNode.id)).toBeUndefined();
//     });
// });

// describe("type", () => {
//     it("should be able to create nodes of different types", () => {
//         const document = new Document();
//         const elementNode = document.createNode("element");
//         const textNode = document.createNode("text");

//         expect(elementNode.type).toBe("element");
//         expect(textNode.type).toBe("text");
//     });

//     it("should throw an error when creating a node of an unregistered type", () => {
//         const document = new Document();
//         expect(() => document.createNode("unregisteredType" as never)).toThrow("Type unregisteredType not found in registry");
//     });
// });

// describe("node id management", () => {
//     it("should generate unique IDs for nodes", () => {
//         const document = new Document();
//         const node1 = document.createNode("element");
//         const node2 = document.createNode("element");

//         expect(node1.id).not.toBe(node2.id);
//     });

//     it("should update the document when a node's ID is changed", () => {
//         const document = new Document();
//         const node = document.createNode("element");
//         const oldId = node.id;
//         const newId = "new-id";

//         node.id = newId;

//         expect(document.getNode(oldId)).toBeUndefined();
//         expect(document.getNode(newId)).toBeDefined();
//     });

//     it("should keeps children intact when a node's ID is changed", () => {
//         const document = new Document();
//         const parentNode = document.createNode("element");
//         const childNode = document.createNode("element");

//         parentNode.appendChild(childNode);
//         const oldId = parentNode.id;
//         const newId = "new-parent-id";

//         parentNode.id = newId;

//         expect(document.getNode(oldId)).toBeUndefined();
//         expect(document.getNode(newId)).toBeDefined();
//         expect(childNode.parent).toBe(parentNode);
//     });
// });

// describe("children management", () => {
//     it("should throw an error when trying to remove a child that is not a child of the node", () => {
//         const document = new Document();
//         const parentNode = document.createNode("element");
//         const childNode = document.createNode("element");

//         expect(() => parentNode.removeChild(childNode)).toThrow("The specified node is not a child of this node.");
//     });

//     it("should delete a node and remove it from its parent", () => {
//         const document = new Document();
//         const parentNode = document.createNode("element");
//         const childNode = document.createNode("element");

//         parentNode.appendChild(childNode);
//         childNode.delete();

//         expect(childNode.parent).toBeNull();
//         expect(document.getNode(childNode.id)).toBeUndefined();
//     });
// });