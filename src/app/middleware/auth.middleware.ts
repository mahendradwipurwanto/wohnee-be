import {Request, Response, NextFunction} from "express";
import {CustomHttpExceptionError} from "../../lib/helper/errorHandler";
import {TokenJwtVerification} from "../../lib/auth/token";
import {TokenData} from "../../lib/types/data/auth";
import loggerHandler from "../../lib/helper/loggerHandler";

/**
 * ✅ Extend Express Request type for verified JWT metadata
 */
declare module "express" {
    export interface Request {
        id?: string;
        authentik_userId?: string;
        authentik_access_token?: string;
        email?: string;
        name?: string;
        role?: string;
        type?: number;
        permissions?: Record<string, any>;
        date?: string;
        expired?: string;
        jwt_verified?: boolean;
    }
}

/**
 * ✅ Middleware factory for verifying JWT and attaching decoded metadata.
 *
 * @param prefix - API prefix (e.g. "/api/v1")
 * @returns Express middleware function
 */
export function VerifyJwtToken(prefix: string) {
    // ✅ Regex-based route patterns for wildcard matching
    const openRoutePatterns = [
        new RegExp(`^${prefix}/health$`),
        new RegExp(`^${prefix}/auth/sign-(in|up|out)$`),
        new RegExp(`^${prefix}/docs($|/.*)`),          // ✅ bypass /docs/**
        new RegExp(`^${prefix}/files/images($|/.*)`),
        new RegExp(`/favicon\\.ico$`),
    ];

    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            const {headers} = req;

            const fullPath = req.originalUrl.split("?")[0]; // remove query params

            // ✅ Bypass open/public routes
            if (openRoutePatterns.some((pattern) => pattern.test(fullPath))) {
                loggerHandler.debug(`[AUTH] 🧩 Bypassed JWT check for route: ${fullPath}`);
                return next();
            }


            // --- Validate Authorization header
            const authHeader = headers["authorization"] || headers["Authorization"];
            if (!authHeader || typeof authHeader !== "string") {
                throw new CustomHttpExceptionError("Missing Authorization header", 401);
            }

            // --- Parse Bearer token
            const [scheme, token] = authHeader.trim().split(/\s+/);
            if (scheme.toLowerCase() !== "bearer" || !token) {
                throw new CustomHttpExceptionError("Invalid Authorization format", 401);
            }

            // --- Verify JWT
            const metadata: TokenData | null = await TokenJwtVerification(token, false);
            if (!metadata) {
                throw new CustomHttpExceptionError("Invalid or expired token", 401);
            }

            // --- Attach verified metadata to request
            Object.assign(req, {
                id: metadata.id,
                authentik_userId: metadata.authentik_userId,
                authentik_access_token: metadata.authentik_access_token,
                email: metadata.email,
                name: metadata.name,
                role: metadata.role,
                type: metadata.type,
                permissions: metadata.permissions,
                date: metadata.date,
                expired: metadata.expired,
                jwt_verified: true,
            });

            loggerHandler.debug(`[AUTH] ✅ Token verified for user: ${metadata.email || metadata.id}`);
            next();
        } catch (error: any) {
            // --- Handle known JWT errors
            const errName = error?.name || "";
            if (errName === "TokenExpiredError") {
                loggerHandler.warn(`[AUTH] ⏰ Token expired for request: ${req.path}`);
                return next(new CustomHttpExceptionError("Token has expired", 401));
            }
            if (errName === "JsonWebTokenError") {
                loggerHandler.warn(`[AUTH] ❌ Invalid token signature for request: ${req.path}`);
                return next(new CustomHttpExceptionError("Invalid token signature", 401));
            }

            // --- Unknown or custom error
            loggerHandler.error(`[AUTH] 🚫 JWT verification failed: ${error.message}`);
            return next(
                new CustomHttpExceptionError(error.message || "Authentication failed", 401)
            );
        }
    };
}