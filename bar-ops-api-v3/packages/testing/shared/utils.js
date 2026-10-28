/**
 * Generates a unique 9-digit identity number.
 * @returns {string} A 9-digit string.
 */
export function generateUniqueId() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

/**
 * Generates a unique 10-digit phone number starting with '05'.
 * @returns {string} A 10-digit phone number string.
 */
export function generateUniquePhone() {
  return '05' + Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Message-sending flows need a number allow-listed as a WhatsApp test recipient.
// It is shared across runs (not unique), so use it only where a message is actually sent.
export const VERIFIED_TEST_PHONE = process.env.TEST_WHATSAPP_PHONE || '0501234567';

// Unwrap API response payload (handles { data: { data }
export function extractData(response) {
  if (response && response.data) {
    if (response.data.data !== undefined) return response.data.data;
    return response.data;
  }
  return null;
}

// Extract entity ID from response payload
export function extractId(response) {
  const data = extractData(response);
  if (data && data.id) return data.id;
  return 'mock_id';
}

// Fixed valid UUID for fixture-free 403 probes (guard fires before handler)
export function fakeId() {
  return '00000000-0000-4000-8000-000000000000';
}
