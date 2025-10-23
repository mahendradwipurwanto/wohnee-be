import fs from "fs";
import crypto from "crypto";
import path from "path";
import loggerHandler from "../helper/loggerHandler";

/**
 * 🔐 Cache keys in memory for performance
 */
let cachedKeys: { publicKey?: string; privateKey?: string } = {};

/**
 * ✅ Securely load RSA key pair (supports .pem file or base64)
 */
function loadKey(envVar: string, keyType: "public" | "private"): string {
    if (cachedKeys[keyType]) return cachedKeys[keyType]!;

    const keyValue = process.env[envVar];
    if (!keyValue) {
        throw new Error(`[SIGNATURE] Missing environment variable: ${envVar}`);
    }

    // Allow both direct PEM strings and file paths
    const resolvedValue = keyValue.includes("BEGIN")
        ? keyValue // Direct PEM in env
        : path.resolve(keyValue); // File path

    let key: string;
    if (fs.existsSync(resolvedValue)) {
        key = fs.readFileSync(resolvedValue, "utf8").trim();
    } else {
        key = resolvedValue.trim();
    }

    cachedKeys[keyType] = key;
    loggerHandler.debug(`[SIGNATURE] Loaded ${keyType} key (${key.startsWith("-----") ? "PEM" : "inline"})`);
    return key;
}

/**
 * ✅ Initialize RSA keys on module load
 */
const publicKey = loadKey("JWT_PUBLIC_KEY_FILEPATH", "public");
const privateKey = loadKey("JWT_PRIVATE_KEY_FILEPATH", "private");

/**
 * ✅ Create a digital signature using RSA-PSS + SHA-256
 *
 * @param message - The string message to sign
 * @returns Base64-encoded signature
 */
export function createSignatureMessage(message: string): string {
    if (!message || typeof message !== "string") {
        throw new Error("[SIGNATURE] Message must be a non-empty string");
    }

    try {
        const signer = crypto.createSign("sha256");
        signer.update(message);
        signer.end();

        const signature = signer.sign(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
            },
            "base64"
        );

        loggerHandler.debug(`[SIGNATURE] ✅ Signature created for message of length ${message.length}`);
        return signature;
    } catch (err: any) {
        loggerHandler.error(`[SIGNATURE] ❌ Error creating signature: ${err.message}`);
        throw new Error("Failed to create digital signature.");
    }
}

/**
 * ✅ Verify a digital signature using RSA-PSS + SHA-256
 *
 * @param message - Original message
 * @param signature - Base64 signature to verify
 * @returns true if valid, false if invalid
 */
export function verifySignature(message: string, signature: string): boolean {
    if (!message || !signature) {
        loggerHandler.warn(`[SIGNATURE] ⚠️ Missing message or signature for verification`);
        return false;
    }

    try {
        const verifier = crypto.createVerify("sha256");
        verifier.update(message);
        verifier.end();

        const isValid = verifier.verify(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
                saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
            },
            signature,
            "base64"
        );

        loggerHandler.debug(`[SIGNATURE] 🔎 Verification result: ${isValid}`);
        return isValid;
    } catch (err: any) {
        loggerHandler.error(`[SIGNATURE] ❌ Verification error: ${err.message}`);
        return false;
    }
}