export type PageObject = {
    id: string;
    title: string;
    description?: string;
    route: string;
    status: "inactive" | "active";
    createdAt: Date;
    updatedAt: Date;
};