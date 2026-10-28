import { v5 as uuidv5 } from 'uuid';

// Fixed namespace for KICK's name-based ids. Never change it: every derived id would change.
const KICK_ID_NAMESPACE = '6f1c2b8e-4a53-5d1e-9a0f-3c7b8e2d4f61';

// Same parts in, same UUID out (RFC 4122 v5). Used where an event may be delivered more
// than once, so the retry addresses the row the first delivery wrote instead of a new one.
// Output is a valid UUID, so it still passes the DTOs' @IsUUID().
export const deterministicId = (...parts: string[]): string => uuidv5(parts.join('#'), KICK_ID_NAMESPACE);
