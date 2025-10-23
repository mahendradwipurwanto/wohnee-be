/**
 * ✅ Normalize `X-Date` header format
 *
 * Supports:
 *   - ISO 8601 → "2025-10-23T08:15:30Z"
 *   - Compact  → "20251023T081530Z"
 *
 * Returns a normalized ISO 8601 UTC string if valid,
 * otherwise throws an error for malformed inputs.
 */
export function normalizeDateString(dateHeader: string): string {
    if (!dateHeader || typeof dateHeader !== "string") {
        throw new Error("[normalizeDateString] X-Date header is missing or invalid.");
    }

    // Compact format: 20251023T081530Z
    const compactPattern = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

    if (compactPattern.test(dateHeader)) {
        return dateHeader.replace(compactPattern, "$1-$2-$3T$4:$5:$6Z");
    }

    // ISO 8601 format check
    const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    if (isoPattern.test(dateHeader)) {
        return dateHeader;
    }

    throw new Error(`[normalizeDateString] Invalid X-Date format: ${dateHeader}`);
}

/**
 * ✅ Build canonical message for signature verification
 *
 * Must match **exactly** what the client used to sign.
 * Canonical format:
 *   `${url}:${signatureKey}:${dateHeader}`
 *
 * Example:
 *   /api/v1/auth/sign-in:SECRET_KEY:2025-10-23T08:15:30Z
 */
export function buildCanonicalMessage(
    signatureKey: string,
    url: string,
    dateHeader: string
): string {
    if (!signatureKey) {
        throw new Error("[buildCanonicalMessage] Missing signature key.");
    }
    if (!url) {
        throw new Error("[buildCanonicalMessage] Missing request URL.");
    }
    if (!dateHeader) {
        throw new Error("[buildCanonicalMessage] Missing date header.");
    }

    const normalizedDate = normalizeDateString(dateHeader);
    return `${url}:${signatureKey}:${normalizedDate}`;
}