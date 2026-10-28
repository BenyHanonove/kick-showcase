// Import external framework dependencies and status codes from third party packages
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./client.s3";

export const PRESIGN_EXPIRY_SECONDS = 86400;

// Allowlisted upload extensions mapped to their MIME types
const ALLOWED_CONTENT_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".csv": "text/csv",
    ".pdf": "application/pdf",
};

// Resolve MIME type from allowlisted extension only configuration setting for
const contentTypeFor = (fileName: string): string => {
    const dotIdx = fileName.lastIndexOf(".");
    const ext = dotIdx >= 0 ? fileName.slice(dotIdx).toLowerCase() : "";
    const contentType = ALLOWED_CONTENT_TYPES[ext];
    if (!contentType) {
        throw new Error(`Unsupported upload file extension: "${ext || fileName}"`);
    }
    return contentType;
};

// Upload file to S3 and return presigned URL
export const uploadToS3 = async (
    file: Buffer | Uint8Array | string,
    pathParts: string[],
    fileName: string,
    contentType?: string
): Promise<{ key: string; downloadUrl: string }> => {
    const bucketName = process.env.GLOBAL_BUCKET;
    if (!bucketName) {
        throw new Error("Server configuration error: GLOBAL_BUCKET environment variable is missing");
    }

    const key = [...pathParts, fileName].join("/");

    // Upload file; caller-supplied content type bypasses the extension allowlist
    // (used for resources like Document that accept any file type)
    const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: typeof file === "string" ? Buffer.from(file) : file,
        ContentType: contentType || contentTypeFor(fileName),
    });

    await s3Client.send(putCommand);

    const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });
    const downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: PRESIGN_EXPIRY_SECONDS });

    return { key, downloadUrl };
};

// Delete file from S3 by path parts definition for application
export const deleteFromS3 = async (pathParts: string[]): Promise<string> => {
    const bucketName = process.env.GLOBAL_BUCKET;
    if (!bucketName) {
        throw new Error("Server configuration error: GLOBAL_BUCKET environment variable is missing");
    }

    const key = pathParts.join("/");

    const deleteCommand = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    await s3Client.send(deleteCommand);
    return key;
};
