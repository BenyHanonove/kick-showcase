import { randomInt, timingSafeEqual } from 'crypto';

export const MAX_OTP_ATTEMPTS = 5;

// Generate a random 4-digit OTP, zero-padded (e.g. "0042")
export const generateOtp = (): string => randomInt(0, 10000).toString().padStart(4, '0');

// Constant-time equality check for 4-digit OTPs - avoids timing side channels
export const isOtpEqual = (a: string, b: string): boolean => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    // Length must match before timingSafeEqual (it throws on mismatched lengths);
    // comparing against a fixed-length buffer keeps this branch itself uninformative
    if (bufA.length !== bufB.length) {
        timingSafeEqual(bufA, bufA);
        return false;
    }

    return timingSafeEqual(bufA, bufB);
};
