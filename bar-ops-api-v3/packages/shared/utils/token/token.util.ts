// Import external framework dependencies and status codes from third party packages
import { randomBytes } from 'crypto';

export const generateToken = (): string => randomBytes(32).toString('base64url');
