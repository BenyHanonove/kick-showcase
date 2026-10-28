import { type APIGatewayProxyEventV2, type APIGatewayProxyResultV2 } from "aws-lambda";
import { StatusCodes } from "http-status-codes";
import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { uploadToS3, deleteFromS3, PRESIGN_EXPIRY_SECONDS } from "./bucket.s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "./client.s3";

import { docClient } from '@aws/dynamo/client.dynamo';
import { compressImage } from '@utils/image/image.util';
import { logger } from '@utils/logger/logger.util';

export interface PresignOptions<T> {
    dto: ClassConstructor<T>;
    folder: string;
    missingParamsMessage: string;
    configErrorMessage: string;
    notFoundMessage: string;
    validationFailedMessage: string;
    successMessage: string;
    internalErrorMessage: string;
}

// Handle upload and presign generation
export const handlePresignAttachment = async <T extends { receiptKey?: string; receiptUrl?: string; timestamp?: string }>(
    event: APIGatewayProxyEventV2,
    options: PresignOptions<T>
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { file, sessionId, id, filename } = body;

        if (!file || !sessionId || !id) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: options.missingParamsMessage }),
            };
        }

        const bucketName = process.env.GLOBAL_BUCKET;
        if (!bucketName) {
            return {
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                body: JSON.stringify({ message: options.configErrorMessage }),
            };
        }

        const { Item: existingItem } = await docClient.send(
            new GetCommand({
                TableName: process.env.TABLE,
                Key: { id },
            })
        );

        if (!existingItem) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: options.notFoundMessage }),
            };
        }

        let fileBuffer: Buffer;
        if (typeof file === "string") {
            if (file.includes(";base64,")) {
                fileBuffer = Buffer.from(file.split(";base64,")[1], "base64");
            } else {
                fileBuffer = Buffer.from(file, "base64");
            }
        } else {
            fileBuffer = Buffer.from(file);
        }

        // Allowlist extension instead of trusting client filename
        const allowedExts = [".jpg", ".jpeg", ".png", ".webp"];
        const rawExt = filename && filename.includes(".")
            ? filename.substring(filename.lastIndexOf(".")).toLowerCase()
            : ".jpg";
        const originalExt = allowedExts.includes(rawExt) ? rawExt : ".jpg";

        const uniqueFilename = `${id}${originalExt}`;

        const { buffer: processedBuffer, filename: processedFilename } = await compressImage(fileBuffer, uniqueFilename);

        const { key, downloadUrl } = await uploadToS3(processedBuffer, [options.folder, sessionId], processedFilename);

        const updatedItem = {
            ...existingItem,
            receiptKey: key,
            timestamp: new Date().toISOString(),
        };

        const instance = plainToInstance(options.dto, updatedItem, {
            enableImplicitConversion: true,
        });

        const errors = await validate(instance as object);
        if (errors.length > 0) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({
                    message: options.validationFailedMessage,
                    errors,
                }),
            };
        }

        await docClient.send(
            new PutCommand({
                TableName: process.env.TABLE,
                Item: updatedItem,
            })
        );

        instance.receiptUrl = downloadUrl;

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: options.successMessage,
                data: instance,
            }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: options.internalErrorMessage }),
        };
    }
};

export interface UnsignOptions<T> {
    dto: ClassConstructor<T>;
    missingIdMessage: string;
    notFoundMessage: string;
    validationFailedMessage: string;
    successMessage: string;
    internalErrorMessage: string;
}

// Handle object removal and unsigning
export const handleUnsignAttachment = async <T extends { receiptKey?: string; receiptUrl?: string; timestamp?: string }>(
    event: APIGatewayProxyEventV2,
    options: UnsignOptions<T>
): Promise<APIGatewayProxyResultV2> => {
    try {
        const body = JSON.parse(event.body || "{}");
        const { id } = body;

        if (!id) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ message: options.missingIdMessage }),
            };
        }

        const { Item: existingItem } = await docClient.send(
            new GetCommand({
                TableName: process.env.TABLE,
                Key: { id },
            })
        );

        if (!existingItem) {
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: JSON.stringify({ message: options.notFoundMessage }),
            };
        }

        if (existingItem.receiptKey) {
            try {
                const pathParts = existingItem.receiptKey.split("/");
                await deleteFromS3(pathParts);
            } catch (s3Err) {
                logger.error("Failed to delete receipt from S3:", existingItem.receiptKey, s3Err);
            }
        }

        const updatedItem = { ...existingItem };
        delete updatedItem.receiptKey;
        delete updatedItem.receiptUrl;
        updatedItem.timestamp = new Date().toISOString();

        const instance = plainToInstance(options.dto, updatedItem, {
            enableImplicitConversion: true,
        });

        const errors = await validate(instance as object);
        if (errors.length > 0) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({
                    message: options.validationFailedMessage,
                    errors,
                }),
            };
        }

        await docClient.send(
            new PutCommand({
                TableName: process.env.TABLE,
                Item: updatedItem,
            })
        );

        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({
                message: options.successMessage,
                data: instance,
            }),
        };
    } catch (err: unknown) {
        logger.error(err);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: options.internalErrorMessage }),
        };
    }
};

// Generate presigned GET URL
export const getPresignedUrl = async (
    key: string | undefined | null,
    expiresIn: number = PRESIGN_EXPIRY_SECONDS
): Promise<string | null> => {
    if (!key) return null;

    const bucketName = process.env.GLOBAL_BUCKET;
    if (!bucketName) return null;

    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (err) {
        logger.error("Failed to generate presigned S3 URL:", key, err);
        return null;
    }
};

// Upload Z-report CSV and return key with signed URL
export const uploadAndSignZReport = async (
    csvContent: string,
    sessionId: string,
    cashierId: string
): Promise<{ key: string; downloadUrl: string }> => {
    const filename = `z-report-${cashierId}.csv`;
    const buffer = Buffer.from(csvContent, 'utf-8');
    return uploadToS3(buffer, ['z-reports', sessionId], filename);
};

