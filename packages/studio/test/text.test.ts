import { describe, it, expect } from 'vitest';
import { getNodeAncestors, NodeModel } from '@/libs/node';
import { applyFormatted } from '@/libs/node/types/text/tools';
import { TextTypeData } from '@/libs/node/types/text/TextType';

function buildDoc(content = "Hallo World", rootTag = 'p') {
    const root = new NodeModel<TextTypeData>({
        id: 'root',
        type: 'text',
        content: content,
        tagName: rootTag,
    });
    return { root, map: new Map<string, NodeModel>([[root.id, root]]) };
}

function findNodeByContent(map: Map<string, NodeModel>, content: string): NodeModel | undefined {
    return Array.from(map.values()).find((n) => n.content === content);
}

const getAncestors = (node: NodeModel, map: Map<string, NodeModel>) =>
    Array.from(getNodeAncestors(node, map).values())
        .map((n) => n.tagName)
        .reverse().join(" > ");


describe('applyFormatted', () => {
    const textContent = "Hello world";
    const { root, map } = buildDoc(textContent);
    let contents = map;

    // strong("Hello")
    it('bold', () => {
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: { anchor: 0, focus: 5 },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello');
        expect(hello).toBeDefined();
        expect(hello?.tagName).toBe('strong'); // strong("Hello")
    });

    // strong(em("Hello"))
    it('italic', () => {
        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: { anchor: 0, focus: 5 },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello');
        expect(hello).toBeDefined();
        expect(hello?.tagName).toBe('em');
        expect(getAncestors(hello!, contents)).toBe('strong'); // strong(em("Hello"))
    });

    // strong(em(u("Hello")))
    it('underline', () => {
        contents = applyFormatted({
            format: 'underline',
            descendants: contents,
            selection: { anchor: 0, focus: 5 },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello');
        expect(hello).toBeDefined();
        expect(hello?.tagName).toBe('u');
        expect(getAncestors(hello!, contents)).toBe('strong > em'); // strong(em(u("Hello")))
    });

    // em(u("Hello"))
    it('unbold', () => {
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: { anchor: 0, focus: 5 },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello');
        expect(hello).toBeDefined();
        expect(getAncestors(hello!, contents)).toBe('em > u'); // em(u("Hello"))
    });

    it('unitalic', () => {
        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: { anchor: 0, focus: 5 },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello');
        expect(hello).toBeDefined();
        expect(getAncestors(hello!, contents)).toBe('u'); // u("Hello")
    });

    it('ununderline', () => {
        contents = applyFormatted({
            format: 'underline',
            descendants: contents,
            selection: { anchor: 0, focus: 5 },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello');
        expect(hello).toBeDefined();
        expect(getAncestors(hello!, contents)).toBe(''); // "Hello"
    });

    it('root is plain text', () => {
        expect(root.content).toBe('Hello world');
        expect(root.tagName).toBe('p');
    })

    it('bold all text', () => {
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: { anchor: 0, focus: textContent.length },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello world');
        expect(hello).toBeDefined();
        expect(hello?.tagName).toBe('strong'); // strong("Hello world")
    });

    it('unbold all text', () => {
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: { anchor: 0, focus: textContent.length },
            node: root,
        });

        expect(contents).toBeDefined();
        const hello = findNodeByContent(contents, 'Hello world');
        expect(hello).toBeDefined();
        expect(hello?.tagName).toBe('p'); // "Hello world"
    });

    
});