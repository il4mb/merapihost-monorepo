type StringVariable = {
    name: string;
    value: string;
};
type NumberVariable = {
    name: string;
    value: number;
};
type BooleanVariable = {
    name: string;
    value: boolean;
};
type ObjectVariable = {
    name: string;
    value: Record<string, any>;
};
type ArrayVariable = {
    name: string;
    value: any[];
};
type SourceVariable = {
    name: string;
    value: string;
    config: {
        url: string;
        method: string;
        headers?: Record<string, string>;
    };
};

export type NodeVariable = StringVariable | NumberVariable | BooleanVariable | ObjectVariable | ArrayVariable | SourceVariable;
export type NodeObject = {
    id: string;
    type?: string;
    tagName?: string;
    name?: string;
    props?: Record<string, any>;
    parent?: string | null;
    order?: number;
    visible?: boolean;
};

