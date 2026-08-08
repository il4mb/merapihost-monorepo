export type AssetObject = {
    id: string;
    parentId: string | null;
    name: string;
    type: string;
    metadata?: {
        size: number;
        mimeType: string;
        objectKey: string;
    }
}