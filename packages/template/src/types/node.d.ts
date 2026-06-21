type StringVariable = {
    name: string;
    type: "string";
    value?: string;
};
type NumberVariable = {
    name: string;
    type: "number";
    value?: number;
};
type BooleanVariable = {
    name: string;
    type: "boolean";
    value?: boolean;
};
type JSONVariable = {
    name: string;
    type: "json";
    value?: Record<string, any>;
};

type SourceVariable = {
    name: string;
    type: "source";
    value?: string;
    config?: {
        url: string;
        method: string;
        headers?: Record<string, string>;
    };
};

export type Variable = StringVariable | NumberVariable | BooleanVariable | JSONVariable  | SourceVariable;
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

