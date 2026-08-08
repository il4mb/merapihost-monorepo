export type PageMeta = {
    name: string;
    type: string;
    content: string;
}
export type PageObject = {
    id: string;
    title: string;
    description?: string;
    meta?: PageMeta[];
    route: string;
    status: "draft" | "published" | "archived";
    createdAt: Date;
    updatedAt: Date;
};