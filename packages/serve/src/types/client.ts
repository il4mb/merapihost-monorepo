export interface MetaTag {
    name: string;
    type: string;
    content: string;
}

export interface TPage {
    id: string;
    route: string;
    title: string;
    description: string;
    meta: {
        name: string;
        type: string;
        content: string;
    }[];
    data: BlockNode[];
}

export type BlockNode = {
    id: string;
    type: string;
    tagName?: string;
    props: Record<string, any>;
    parent: string | null;
};
