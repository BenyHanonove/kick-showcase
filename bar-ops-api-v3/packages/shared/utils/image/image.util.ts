// Import external framework dependencies and status codes from third party packages
import { Jimp, ResizeStrategy } from "jimp";

// Import shared AWS services, guard security middleware, and utility helpers
import { logger } from '@utils/logger/logger.util';

const getImageType = (buffer: Buffer): { match: boolean; ext?: string; mime?: string } => {
    if (buffer.length < 4) return { match: false };

    // Verify if buffer matches JPEG magic signature bytes
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { match: true, ext: "jpg", mime: "image/jpeg" };
    }
    // Verify if buffer matches PNG magic signature bytes
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
        return { match: true, ext: "png", mime: "image/png" };
    }
    // Verify if buffer matches WebP magic signature bytes
    if (
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
        return { match: true, ext: "webp", mime: "image/webp" };
    }

    return { match: false };
};

// Resize input image buffer and compress to JPEG
export async function compressImage(
    buffer: Buffer,
    filename: string
): Promise<{ buffer: Buffer; filename: string }> {
    const { match } = getImageType(buffer);
    if (!match) {
        return { buffer, filename };
    }

    try {
        const image = await Jimp.read(buffer);
        const width = image.width;
        const height = image.height;
        const MAX_DIMENSION = 1600;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
                image.resize({ w: MAX_DIMENSION, mode: ResizeStrategy.NEAREST_NEIGHBOR });
            } else {
                image.resize({ h: MAX_DIMENSION, mode: ResizeStrategy.NEAREST_NEIGHBOR });
            }
        }

        // Encode image to JPEG format with quality compression
        const compressedBuffer = await image.getBuffer("image/jpeg", { quality: 75 });
        
        // Change file extension of output filename to JPEG
        let newFilename = filename;
        const extIdx = filename.lastIndexOf(".");
        if (extIdx > 0) {
            newFilename = filename.substring(0, extIdx) + ".jpg";
        } else {
            newFilename = filename + ".jpg";
        }

        return { buffer: compressedBuffer, filename: newFilename };
    } catch (err) {
        logger.error("Failed to compress image, using original buffer:", err);
        return { buffer, filename };
    }
}
