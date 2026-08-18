import { describe, it, expect } from 'vitest';
import { getNodeAncestors, NodeModel } from '@/libs/node';
import { applyFormatted } from '@/libs/node/types/text/tools';
import { TextTypeData } from '@/libs/node/types/text/TextType';

const buildDoc = (
    content = 'Hallo World',
    rootTag = 'p',
) => {
    const root = new NodeModel<TextTypeData>({
        id: 'root',
        type: 'text',
        content,
        tagName: rootTag,
    });

    return {
        root,
        map: new Map<string, NodeModel>([
            [root.id, root],
        ]),
    };
};

const findNodeByContent = (
    map: Map<string, NodeModel>,
    content: string,
): NodeModel | undefined => {
    return Array.from(map.values()).find(
        (node) => node.content === content,
    );
};

const getAncestors = (
    node: NodeModel,
    map: Map<string, NodeModel>,
) =>
    Array.from(getNodeAncestors(node, map).values())
        .map((node) => node.tagName)
        .reverse()
        .join(' > ');

const getContentsText = (
    map: Map<string, NodeModel>,
) => {
    return Array.from(map.values())
        .filter((node) => node.content !== undefined)
        .sort(
            (a, b) =>
                (a.order ?? 0) -
                (b.order ?? 0),
        )
        .map((node) => node.content)
        .join('');
};

const getTextNodes = (
    map: Map<string, NodeModel>,
) => {
    return Array.from(map.values())
        .filter(
            (node) =>
                node.content !== undefined,
        )
        .sort(
            (a, b) =>
                (a.order ?? 0) -
                (b.order ?? 0),
        );
};

const expectTreeIntegrity = (
    map: Map<string, NodeModel>,
) => {
    for (const node of map.values()) {
        if (
            node.parent !== null &&
            node.parent !== undefined
        ) {
            expect(map.has(node.parent)).toBe(true);
        }
    }

    const ids = Array.from(map.values())
        .map((node) => node.id);

    expect(
        new Set(ids).size,
    ).toBe(ids.length);
};

const expectFlatTree = (
    map: Map<string, NodeModel>,
    expected: Array<{
        content: string;
        tagName: string;
    }>,
) => {
    const nodes = getTextNodes(map);

    expect(
        nodes.map((node) => ({
            content: node.content,
            tagName: node.tagName,
        })),
    ).toEqual(expected);
};

const expectNode = (
    map: Map<string, NodeModel>,
    content: string,
    tagName: string,
) => {
    const node = findNodeByContent(
        map,
        content,
    );

    expect(node).toBeDefined();
    expect(node!.tagName).toBe(tagName);

    return node!;
};

const expectFormatChain = (
    map: Map<string, NodeModel>,
    content: string,
    leafTag: string,
    ancestors: string,
) => {
    const node = expectNode(
        map,
        content,
        leafTag,
    );

    expect(
        getAncestors(node, map),
    ).toBe(ancestors);

    return node;
};


/*
|--------------------------------------------------------------------------
| Fresh document
|--------------------------------------------------------------------------
*/

describe('fresh document', () => {
    it('bold(world) => span(Hello ) + strong(world)', () => {
        const { root, map } =
            buildDoc('Hello world');

        const contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expectFlatTree(contents!, [
            {
                content: 'Hello ',
                tagName: 'span',
            },
            {
                content: 'world',
                tagName: 'strong',
            },
        ]);

        expect(
            getContentsText(contents!),
        ).toBe('Hello world');

        expectTreeIntegrity(contents!);
    });


    it('bold(Hello) => strong(Hello) + span( world)', () => {
        const { root, map } =
            buildDoc('Hello world');

        const contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expectFlatTree(contents!, [
            {
                content: 'Hello',
                tagName: 'strong',
            },
            {
                content: ' world',
                tagName: 'span',
            },
        ]);

        expect(
            getContentsText(contents!),
        ).toBe('Hello world');

        expectTreeIntegrity(contents!);
    });


    it('bold(ell) => span(H) + strong(ell) + span(o world)', () => {
        const { root, map } =
            buildDoc('Hello world');

        const contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 1,
                focus: 4,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expectFlatTree(contents!, [
            {
                content: 'H',
                tagName: 'span',
            },
            {
                content: 'ell',
                tagName: 'strong',
            },
            {
                content: 'o world',
                tagName: 'span',
            },
        ]);

        expect(
            getContentsText(contents!),
        ).toBe('Hello world');

        expectTreeIntegrity(contents!);
    });


    it('bold(o) => span(Hell) + strong(o) + span( world)', () => {
        const { root, map } =
            buildDoc('Hello world');

        const contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 4,
                focus: 5,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expectFlatTree(contents!, [
            {
                content: 'Hell',
                tagName: 'span',
            },
            {
                content: 'o',
                tagName: 'strong',
            },
            {
                content: ' world',
                tagName: 'span',
            },
        ]);

        expect(
            getContentsText(contents!),
        ).toBe('Hello world');

        expectTreeIntegrity(contents!);
    });


    it('bold(all) => strong(Hello world)', () => {
        const { root, map } =
            buildDoc('Hello world');

        const contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 11,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expectFlatTree(contents!, [
            {
                content: 'Hello world',
                tagName: 'strong',
            },
        ]);

        expectTreeIntegrity(contents!);
    });
});


/*
|--------------------------------------------------------------------------
| Reverse selection
|--------------------------------------------------------------------------
*/

describe('reverse selection', () => {
    it('bold works with reversed selection', () => {
        const { root, map } =
            buildDoc('Hello world');

        const contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 11,
                focus: 6,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expectFlatTree(contents!, [
            {
                content: 'Hello ',
                tagName: 'span',
            },
            {
                content: 'world',
                tagName: 'strong',
            },
        ]);
    });


    it('italic works with reversed selection', () => {
        const { root, map } =
            buildDoc('Hello world');

        const contents = applyFormatted({
            format: 'italic',
            descendants: map,
            selection: {
                anchor: 5,
                focus: 0,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expectFlatTree(contents!, [
            {
                content: 'Hello',
                tagName: 'em',
            },
            {
                content: ' world',
                tagName: 'span',
            },
        ]);
    });
});


/*
|--------------------------------------------------------------------------
| No-op
|--------------------------------------------------------------------------
*/

describe('no-op', () => {
    it('returns undefined for collapsed selection', () => {
        const { root, map } =
            buildDoc();

        const result = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 5,
                focus: 5,
            },
            node: root,
        });

        expect(result).toBeUndefined();
    });
});


/*
|--------------------------------------------------------------------------
| Remove formatting
|--------------------------------------------------------------------------
*/

describe('remove formatting', () => {
    it('unbold(Hello) => span(Hello) + strong( world)', () => {
        const { root, map } =
            buildDoc('Hello world');

        let contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 11,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        expect(contents).toBeDefined();

        expectFlatTree(contents, [
            {
                content: 'Hello',
                tagName: 'span',
            },
            {
                content: ' world',
                tagName: 'strong',
            },
        ]);

        expect(
            getContentsText(contents),
        ).toBe('Hello world');

        expectTreeIntegrity(contents);
    });


    it('unbold(world) => strong(Hello ) + span(world)', () => {
        const { root, map } =
            buildDoc('Hello world');

        let contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 11,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        })!;

        expect(contents).toBeDefined();

        expectFlatTree(contents, [
            {
                content: 'Hello ',
                tagName: 'strong',
            },
            {
                content: 'world',
                tagName: 'span',
            },
        ]);

        expect(
            getContentsText(contents),
        ).toBe('Hello world');

        expectTreeIntegrity(contents);
    });


    it('unitalic preserves bold', () => {
        const { root, map } =
            buildDoc('Hello world');

        let contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        const hello = findNodeByContent(
            contents,
            'Hello',
        );

        expect(hello).toBeDefined();
        expect(hello!.tagName).toBe('strong');

        expect(
            getAncestors(hello!, contents),
        ).not.toContain('em');

        expectTreeIntegrity(contents);
    });


    it('unbold preserves italic', () => {
        const { root, map } =
            buildDoc('Hello world');

        let contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        const hello = findNodeByContent(
            contents,
            'Hello',
        );

        expect(hello).toBeDefined();
        expect(hello!.tagName).toBe('em');

        expect(
            getAncestors(hello!, contents),
        ).not.toContain('strong');

        expectTreeIntegrity(contents);
    });
});


/*
|--------------------------------------------------------------------------
| Adjacent formatting
|--------------------------------------------------------------------------
*/

describe('adjacent formatting', () => {
    it('bold(Hallo) + bold(World) => bold(Hallo World)', () => {
        const { root, map } =
            buildDoc('Hallo World');

        /*
         * Step 1:
         *
         * bold("Hallo")
         * span(" World")
         */
        let contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        /*
         * Step 2:
         *
         * bold("Hallo")
         * span(" ")
         * bold("World")
         *
         * applyFormatted must normalize
         * equivalent formatting.
         */
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        })!;

        expect(
            getContentsText(contents),
        ).toBe('Hallo World');

        expectFlatTree(contents, [
            {
                content: 'Hallo World',
                tagName: 'strong',
            },
        ]);

        expectTreeIntegrity(contents);
    });


    it('italic(bold(Hallo) + space) + bold(italic(World) => bold(italic(Hallo World))', () => {
        const { root, map } =
            buildDoc('Hallo World');

        let contents = map;

        /*
         * bold("Hallo")
         */
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        /*
         * italic("Hallo ")
         *
         * Expected:
         *
         * italic(
         *   bold("Hallo")
         *   span(" ")
         * )
         */
        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 6,
            },
            node: root,
        })!;

        /*
         * italic + bold("World")
         */
        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        })!;

        expect(
            getContentsText(contents),
        ).toBe('Hallo World');

        const text = findNodeByContent(
            contents,
            'Hallo World',
        );

        expect(text).toBeDefined();

        expect(text!.tagName).toBe('em');

        expect(
            getAncestors(text!, contents),
        ).toBe('strong');

        expectTreeIntegrity(contents);
    });
});


/*
|--------------------------------------------------------------------------
| Three-level formatting
|--------------------------------------------------------------------------
*/

describe('three-level formatting', () => {
    it('underline + italic + bold across whitespace => bold(italic(underline(Hallo World)))', () => {
        const { root, map } =
            buildDoc('Hallo World');

        let contents = map;

        /*
         * bold("Hallo")
         */
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        /*
         * italic("Hallo ")
         */
        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 6,
            },
            node: root,
        })!;

        /*
         * underline("Hallo ")
         */
        contents = applyFormatted({
            format: 'underline',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 6,
            },
            node: root,
        })!;

        /*
         * World:
         *
         * bold
         * italic
         * underline
         */
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'underline',
            descendants: contents,
            selection: {
                anchor: 6,
                focus: 11,
            },
            node: root,
        })!;

        expect(
            getContentsText(contents),
        ).toBe('Hallo World');

        const text = findNodeByContent(
            contents,
            'Hallo World',
        );

        expect(text).toBeDefined();

        /*
         * Leaf = underline
         *
         * Ancestors:
         * strong > em
         */
        expect(text!.tagName).toBe('u');

        expect(
            getAncestors(text!, contents),
        ).toBe('strong > em');

        expectTreeIntegrity(contents);
    });
});


/*
|--------------------------------------------------------------------------
| Partial formatting over existing formats
|--------------------------------------------------------------------------
*/

describe('partial formatting', () => {
    it('underline(Hallo) over bold(italic(Hallo World))', () => {
        const { root, map } =
            buildDoc('Hallo World');

        let contents = map;

        /*
         * bold("Hallo World")
         */
        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 11,
            },
            node: root,
        })!;

        /*
         * italic("Hallo World")
         */
        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 11,
            },
            node: root,
        })!;

        /*
         * underline("Hallo")
         *
         * Expected:
         *
         * underline(
         *   bold(
         *     italic("Hallo")
         *   )
         * )
         *
         * bold(
         *   italic(" World")
         * )
         */
        contents = applyFormatted({
            format: 'underline',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        expect(
            getContentsText(contents),
        ).toBe('Hallo World');

        const hello = findNodeByContent(
            contents,
            'Hallo',
        );

        const world = findNodeByContent(
            contents,
            ' World',
        );

        expect(hello).toBeDefined();
        expect(world).toBeDefined();

        expect(hello!.tagName).toBe('u');

        expect(
            getAncestors(hello!, contents),
        ).toBe('strong > em');

        expect(world!.tagName).toBe('em');

        expect(
            getAncestors(world!, contents),
        ).toBe('strong');

        expectTreeIntegrity(contents);
    });


    it('underline only Hallo does not affect World', () => {
        const { root, map } =
            buildDoc('Hallo World');

        let contents = map;

        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 11,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 11,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'underline',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        expectNode(
            contents,
            'Hallo',
            'u',
        );

        expectNode(
            contents,
            ' World',
            'em',
        );

        expect(
            getContentsText(contents),
        ).toBe('Hallo World');

        expectTreeIntegrity(contents);
    });
});


/*
|--------------------------------------------------------------------------
| Formatting toggle
|--------------------------------------------------------------------------
*/

describe('format toggle', () => {
    it('bold -> italic -> underline -> remove bold', () => {
        const { root, map } =
            buildDoc('Hello world');

        let contents = map;

        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'italic',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'underline',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        contents = applyFormatted({
            format: 'bold',
            descendants: contents,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        })!;

        const hello = findNodeByContent(
            contents,
            'Hello',
        );

        expect(hello).toBeDefined();
        expect(hello!.tagName).toBe('u');

        expect(
            getAncestors(hello!, contents),
        ).toBe('em');

        expect(
            getContentsText(contents),
        ).toBe('Hello world');

        expectTreeIntegrity(contents);
    });
});


/*
|--------------------------------------------------------------------------
| Node identity / immutability
|--------------------------------------------------------------------------
*/

describe('immutability', () => {
    it('does not mutate the original root', () => {
        const { root, map } =
            buildDoc('Hello world');

        const originalContent =
            root.content;

        const originalTag =
            root.tagName;

        const originalId =
            root.id;

        const contents = applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        });

        expect(contents).toBeDefined();

        expect(root.content)
            .toBe(originalContent);

        expect(root.tagName)
            .toBe(originalTag);

        expect(root.id)
            .toBe(originalId);
    });


    it('does not mutate original descendants', () => {
        const { root, map } =
            buildDoc('Hello world');

        const snapshot =
            Array.from(map.values())
                .map((node) => ({
                    id: node.id,
                    content: node.content,
                    parent: node.parent,
                    order: node.order,
                    tagName: node.tagName,
                }));

        applyFormatted({
            format: 'bold',
            descendants: map,
            selection: {
                anchor: 0,
                focus: 5,
            },
            node: root,
        });

        expect(
            Array.from(map.values())
                .map((node) => ({
                    id: node.id,
                    content: node.content,
                    parent: node.parent,
                    order: node.order,
                    tagName: node.tagName,
                })),
        ).toEqual(snapshot);
    });
});


/*
|--------------------------------------------------------------------------
| Text preservation
|--------------------------------------------------------------------------
*/

describe('text preservation', () => {
    it('never loses text after repeated formatting operations', () => {
        const { root, map } =
            buildDoc('Hallo World');

        let contents = map;

        const operations = [
            {
                format: 'bold' as const,
                anchor: 0,
                focus: 5,
            },
            {
                format: 'italic' as const,
                anchor: 0,
                focus: 11,
            },
            {
                format: 'underline' as const,
                anchor: 0,
                focus: 5,
            },
            {
                format: 'bold' as const,
                anchor: 6,
                focus: 11,
            },
            {
                format: 'italic' as const,
                anchor: 6,
                focus: 11,
            },
            {
                format: 'underline' as const,
                anchor: 6,
                focus: 11,
            },
        ];

        for (const operation of operations) {
            contents = applyFormatted({
                format: operation.format,
                descendants: contents,
                selection: {
                    anchor: operation.anchor,
                    focus: operation.focus,
                },
                node: root,
            })!;

            expect(
                getContentsText(contents),
            ).toBe('Hallo World');

            expectTreeIntegrity(contents);
        }
    });
});