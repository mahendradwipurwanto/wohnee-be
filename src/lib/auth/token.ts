import jwt, {JwtPayload, SignOptions, VerifyOptions} from "jsonwebtoken";
import {CustomHttpExceptionError} from "../helper/errorHandler";
import {TokenData} from "../types/data/auth";
import loggerHandler from "../helper/loggerHandler";

const jwtIssuer = process.env.JWT_ISSUER || "perspektive@2025";

/**
 * ✅ Generate a JWT access or refresh token
 *
 * @param data - Token payload data
 * @param expiresIn - Expiry time in seconds (e.g., "3600" for 1 hour)
 * @param isRefresh - Whether this is a refresh token
 */
export async function TokenJwtGenerator(
    data: TokenData,
    expiresIn: string,
    isRefresh = false
): Promise<string> {
    const secretKey = isRefresh
        ? process.env.JWT_REFRESH_SECRET_KEY
        : process.env.JWT_ACCESS_SECRET_KEY;

    if (!secretKey) {
        throw new Error(`[JWT] Missing ${isRefresh ? "refresh" : "access"} secret key`);
    }

    try {
        const now = Date.now();
        const expirationTime = parseInt(expiresIn, 10) * 1000;

        const payload: JwtPayload = {
            id: data.id,
            authentik_userId: data.authentik_userId,
            authentik_access_token: data.authentik_access_token,
            email: data.email,
            name: data.name,
            role: data.role,
            type: data.type,
            permissions: data.permissions,
            date: new Date(now).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"}),
            expired: new Date(now + expirationTime).toLocaleString("id-ID", {timeZone: "Asia/Jakarta"}),
        };

        const options: SignOptions = {
            issuer: jwtIssuer,
            algorithm: "HS256",
            expiresIn: parseInt(expiresIn, 10), // ✅ let jsonwebtoken calculate exp
        };

        const token = jwt.sign(payload, secretKey, options);
        loggerHandler.debug(`[JWT] ✅ Token generated successfully for user: ${data.email || data.id}`);
        return token;
    } catch (error: any) {
        loggerHandler.error(`[JWT] ❌ Failed to generate token: ${error.message}`);
        throw new Error(`Failed to generate token: ${error.message}`);
    }
}

/**
 * ✅ Verify a JWT (access or refresh)
 *
 * @param token - JWT token string
 * @param isRefresh - Whether to use the refresh secret key
 * @returns TokenData if valid, throws otherwise
 */
export async function TokenJwtVerification(
    token: string,
    isRefresh = false
): Promise<TokenData> {
    const secretKey = isRefresh
        ? process.env.JWT_REFRESH_SECRET_KEY
        : process.env.JWT_ACCESS_SECRET_KEY;

    if (!secretKey) {
        throw new Error(`[JWT] Missing ${isRefresh ? "refresh" : "access"} secret key`);
    }

    try {
        const options: VerifyOptions = {
            issuer: jwtIssuer,
            algorithms: ["HS256"],
            clockTolerance: 10, // allow 5s skew
        };

        const decoded = jwt.verify(token, secretKey, options) as JwtPayload;

        if (!decoded || !decoded.id) {
            throw new CustomHttpExceptionError("Invalid or malformed JWT payload", 401);
        }

        loggerHandler.debug(`[JWT] ✅ Verified token for user: ${decoded.email || decoded.id}`);

        return {
            id: decoded.id,
            authentik_userId: decoded.authentik_userId,
            authentik_access_token: decoded.authentik_access_token,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
            type: decoded.type,
            permissions: decoded.permissions,
            date: decoded.date,
            expired: decoded.expired,
        };
    } catch (err: any) {
        const msg =
            err.name === "TokenExpiredError"
                ? "Token has expired"
                : err.name === "JsonWebTokenError"
                    ? "Invalid token signature"
                    : err.name === "NotBeforeError"
                        ? "Token not active yet"
                        : `JWT verification failed: ${err.message}`;

        loggerHandler.warn(`[JWT] ⚠️ ${msg}`);
        throw new CustomHttpExceptionError(msg, 401, err);
    }
}