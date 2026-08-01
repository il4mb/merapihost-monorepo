import { CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { s3Client, awS3Client } from "@/utils/s3-client";
import { Request, Response } from "express";
import { z } from "zod";

const createUploadUrlSchema = z.object({
    contentType: z.string().min(1, "Content type is required")
});

export const createUploadUrl = async (req: Request, res: Response) => {

    const service = req.service!;
    const bucketName = service.bucket;
    const { contentType } = createUploadUrlSchema.parse(req.body);
    const fileId = Bun.randomUUIDv7();

    const initResponse = await awS3Client.send(new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: fileName
    }));
}

const completeUploadSchema = z.object({
    uploadId: z.uuid("Upload ID is required"),
    etag: z.string().min(1, "ETag is required")

});

export const completeUpload = async (req: Request, res: Response) => {
    const { filename } = req.body;
    if (!filename || typeof filename !== "string") {
        return res.status(400).json({
            success: false,
            message: "Filename is required"
        });
    }

    // Here you can implement any logic to mark the upload as complete, e.g., updating a database record.

    res.status(200).json({
        success: true,
        message: "Upload completed successfully"
    });
}