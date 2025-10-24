import {Request, Response, NextFunction} from "express";
import {CustomHttpExceptionError} from "../../lib/helper/errorHandler";
import {verifySignature} from "../../lib/auth/signature";
import loggerHandler from "../../lib/helper/loggerHandler";
import {buildCanonicalMessage, normalizeDateString} from "../../lib/helper/signature";

// --- Environment Config
const SIGNATURE_KEY = process.env.SIGNATURE_KEY || "default_signature_key";
const USE_SIGNATURE = process.env.USE_SIGNATURE === "true";

// Optional: allow configurable request lifetime in minutes
const SIGNATURE_TOLERANCE_MINUTES = parseInt(process.env.SIGNATURE_TOLERANCE_MINUTES || "5", 10);

/**
 * ✅ Middleware: Verify request signatures using RSA-PSS (RSA + SHA256)
 *
 * @param prefix - API prefix (e.g. "/api/v1")
 *
 * Requires headers:
 *   - `X-Signature`: Base64 encoded signature
 *   - `X-Date`: UTC timestamp in ISO or compact format
 *
 * Protects against:
 *   - Request tampering
 *   - Replay attacks (timestamp expiration)
 */
export function VerifyRequestSignature(prefix: string) {// Cache open routes for quick lookup
    const openRoutes = new Set([
        `${prefix}/health`,
        `${prefix}/auth/sign-out`,
    ]);

    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            // --- Skip if signature feature disabled
            if (!USE_SIGNATURE) {
                loggerHandler.debug(`[SIGNATURE] 🔕 Verification disabled for ${req.method} ${req.originalUrl}`);
                return next();
            }

            const {path} = req;

            // --- Skip routes that don't require authentication
            if (
                openRoutes.has(path) ||
                path.includes("/files/images") ||
                path.includes("/favicon.ico")
            ) {
                return next();
            }

            const signatureHeader = req.header("X-Signature");
            const dateHeader = req.header("X-Date");

            if (!signatureHeader || !dateHeader) {
                throw new CustomHttpExceptionError("Missing X-Signature or X-Date header", 403);
            }

            // --- Normalize and validate timestamp
            const normalizedDate = normalizeDateString(dateHeader);
            const requestTime = new Date(normalizedDate).getTime();

            if (isNaN(requestTime)) {
                throw new CustomHttpExceptionError("Invalid X-Date format", 400);
            }

            const diffMinutes = Math.abs((Date.now() - requestTime) / 1000 / 60);
            if (diffMinutes > SIGNATURE_TOLERANCE_MINUTES) {
                loggerHandler.warn(`[SIGNATURE] ❌ Expired timestamp for ${req.method} ${req.originalUrl}`);
                throw new CustomHttpExceptionError("Signature request timestamp expired", 401);
            }

            // --- Construct canonical message (exact same as used during signing)
            const canonicalMessage = buildCanonicalMessage(SIGNATURE_KEY, req.originalUrl, dateHeader);

            // --- Verify signature
            const isValid = verifySignature(canonicalMessage, signatureHeader);
            if (!isValid) {
                loggerHandler.warn(`[SIGNATURE] ❌ Invalid signature for ${req.method} ${req.originalUrl}`);
                throw new CustomHttpExceptionError("Invalid request signature", 401);
            }

            loggerHandler.debug(`[SIGNATURE] ✅ Verified for ${req.method} ${req.originalUrl}`);
            return next();
        } catch (error: any) {
            loggerHandler.error(`[SIGNATURE] ⚠️ Verification failed: ${error.message}`, {
                path: req.originalUrl,
                ip: req.ip,
            });
            return next(error instanceof CustomHttpExceptionError
                ? error
                : new CustomHttpExceptionError("Signature verification failed", 401));
        }
    };
}