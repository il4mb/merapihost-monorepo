import { CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awS3Client, createAwS3Client } from "@/utils/s3-client";
import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import BucketModel from "@/sources/models/bucket";
import { Exception } from "@/utils/exception";

const initUploadSchema = z.object({
    fileName: z.string().min(1, "File name is required"),
    mimeType: z.string().min(1, "MIME type is required")
});

export const initUpload = async (req: Request, res: Response) => {
    const drive = req.local.drive;
    const session = req.local.session; // Assuming authMiddleware is used
    const { fileName, mimeType } = initUploadSchema.parse(req.body);

    if (!drive) {
        throw new Exception({
            status: 404,
            message: "Drive not found",
            type: "DRIVE_NOT_FOUND"
        });
    }

    const bucket = await BucketModel.findById(drive.bucketId);
    if (!bucket) {
        throw new Exception({
            status: 404,
            message: "Bucket not found",
            type: "BUCKET_NOT_FOUND"
        });
    }

    const s3Client = createAwS3Client({
        endpoint: bucket.endpoint,
        accessKey: bucket.accessKey,
        secretKey: bucket.secretKey
    });

    // 
    // Generate a unique Object Key to prevent overwriting files with the same name
    // e.g., "6a706bb6124ee488753e661f/b4d4-4f4d...-document.pdf"
    const uniqueId = crypto.randomUUID();
    const objectKey = `${uniqueId}-${fileName}`;
    const initResponse = await s3Client.send(new CreateMultipartUploadCommand({
        ACL: "private",
        Bucket: bucket.name,
        Key: objectKey,
        ContentType: mimeType
    }));

    const uploadId = initResponse.UploadId;
    if (!uploadId) {
        return res.status(500).json({
            success: false,
            message: "Failed to initiate multipart upload"
        });
    }

    res.json({
        success: true,
        data: {
            uploadId,
            objectKey,
            fileName
        }
    });
}

const getUploadPartUrlSchema = z.object({
    uploadId: z.string().min(1, "Upload ID is required"),
    partNumber: z.number().int().min(1, "Part number must be a positive integer"),
    objectKey: z.string().min(1, "Object key is required")
});

export const getUploadPartUrl = async (req: Request, res: Response) => {
    const { uploadId, partNumber, objectKey } = getUploadPartUrlSchema.parse(req.body);

    const uploadPartCommand = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        PartNumber: partNumber,
        UploadId: uploadId
    });

    // Fix: getSignedUrl requires the S3 client as the first argument
    const presignedUrl = await getSignedUrl(awS3Client, uploadPartCommand, { expiresIn: 3600 });

    res.json({
        success: true,
        data: {
            presignedUrl
        }
    });
}

const completeUploadSchema = z.object({
    uploadId: z.string().min(1, "Upload ID is required"), // AWS UploadIds are NOT standard UUIDs
    objectKey: z.string().min(1, "Object key is required"),
    // S3 requires an array of PartNumbers and ETags to stitch the file back together
    parts: z.array(z.object({
        PartNumber: z.number().int().min(1),
        ETag: z.string().min(1)
    })).min(1, "At least one part is required")
});

export const completeUpload = async (req: Request, res: Response) => {
    const { uploadId, objectKey, parts } = completeUploadSchema.parse(req.body);

    // 1. Tell S3 to stitch the parts together
    const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        UploadId: uploadId,
        MultipartUpload: {
            // S3 requires the parts array to be sorted by PartNumber ascending
            Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
        }
    });

    await awS3Client.send(completeCommand);

    // 2. (Optional but recommended) Here is where you would save the DriveModel to the database
    /*
    const session = req.local.session;
    const newFile = new DriveModel({
        userId: session.user._id,
        name: req.body.fileName, 
        type: "file",
        parentId: req.body.folderId || null,
        metadata: {
            size: req.body.totalSize, // You should pass this from the frontend
            mimeType: req.body.mimeType,
            bucket: BUCKET_NAME,
            objKey: objectKey
        }
    });
    await newFile.save();
    */

    res.status(200).json({
        success: true,
        message: "Upload completed successfully",
        data: {
            objectKey
        }
    });
}