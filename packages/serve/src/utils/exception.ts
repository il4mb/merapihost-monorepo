export type ExceptionDetail = {
    message: string;
    [key: string]: string;
};

export class Exception extends Error {
    readonly type: string;
    readonly status: number;
    readonly details: ExceptionDetail[];

    constructor(params?: Partial<Exception>) {
        super(params?.message ?? "Caught an exception");

        this.name = "Exception";
        this.type = params?.type ?? "Exception";
        this.status = params?.status ?? 500;
        this.details = params?.details ?? [];
        Object.setPrototypeOf(this, new.target.prototype);
    }
}