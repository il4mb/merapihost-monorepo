import { Document } from "../node/react";
import { describe, it, expect } from "vitest";

describe("document", () => {
    it("should initialize with head and body nodes", () => {
        const document = new Document();
        const headNode = document.findNodes(n => n.tagName == "head");
        const bodyNode = document.findNodes(n => n.tagName == "body");
        expect(headNode.length).toBe(1);
        expect(bodyNode.length).toBe(1);
    });

    it("should cannot add another head or body node", () => {
        const document = new Document();
        const headNode = document.createNode("element", { tagName: 'head' });
        const bodyNode = document.createNode("element", { tagName: 'body' });

        expect(() => document.addNode(headNode)).toThrow("Node with tagName 'head' already exists");
        expect(() => document.addNode(bodyNode)).toThrow("Node with tagName 'body' already exists");
    });

    it("should cannot remove head or body node", () => {
        const document = new Document();
        expect(() => document.removeNode("head")).toThrow("Cannot remove node 'head' or 'body'");
        expect(() => document.removeNode("body")).toThrow("Cannot remove node 'head' or 'body'");
    });

    it("appendChild and removeChild should work correctly", () => {
        const document = new Document();
        const parentNode = document.createNode("element", { tagName: 'div' });
        const childNode = document.createNode("element", { tagName: 'span' });

        document.addNode(parentNode);
        parentNode.appendChild(childNode);

        expect(childNode.parent).toBe(parentNode);
        expect(document.getNode(childNode.id)).toBeDefined();

        parentNode.removeChild(childNode);
        expect(childNode.parent).toBeNull();
        expect(document.getNode(childNode.id)).toBeUndefined();
    });

    it("should add and remove nodes correctly", () => {
        const document = new Document();
        const newNode = document.createNode("element", { tagName: 'div' });
        document.addNode(newNode);
        expect(document.getNode(newNode.id)).toBeDefined();

        document.removeNode(newNode.id);
        expect(document.getNode(newNode.id)).toBeUndefined();
    });
});

describe("type", () => {
    it("should be able to create nodes of different types", () => {
        const document = new Document();
        const elementNode = document.createNode("element");
        const textNode = document.createNode("text");

        expect(elementNode.type).toBe("element");
        expect(textNode.type).toBe("text");
    });

    it("should throw an error when creating a node of an unregistered type", () => {
        const document = new Document();
        expect(() => document.createNode("unregisteredType")).toThrow("Type unregisteredType not found in registry");
    });
});
