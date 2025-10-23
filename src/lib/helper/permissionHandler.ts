import {Permission, PermissionAccess} from "../types/data/role";

/**
 * ✅ Convert a stored JSON permission structure into a typed Permission object.
 * Handles invalid data gracefully, ensuring consistent output.
 *
 * Example database JSON:
 * {
 *   "dashboard": { "view": true, "edit": false },
 *   "user": { "create": true, "delete": false }
 * }
 *
 * Output:
 * {
 *   "dashboard": [
 *     { key: "view", access: true },
 *     { key: "edit", access: false }
 *   ],
 *   "user": [
 *     { key: "create", access: true },
 *     { key: "delete", access: false }
 *   ]
 * }
 */
export default function ConvertPermissionsFromDatabase(
    dbPermissionsInput: unknown
): Permission {
    if (!dbPermissionsInput) return {};

    let jsonText: string;

    // --- Normalize input to a valid JSON string
    if (typeof dbPermissionsInput === "string") {
        jsonText = dbPermissionsInput.trim();
    } else if (typeof dbPermissionsInput === "object") {
        try {
            jsonText = JSON.stringify(dbPermissionsInput);
        } catch (error) {
            console.error("[ConvertPermissionsFromDatabase] ❌ Failed to stringify permissions object:", error);
            return {};
        }
    } else {
        console.warn("[ConvertPermissionsFromDatabase] ⚠️ Unsupported permission format, expected string or object:", typeof dbPermissionsInput);
        return {};
    }

    // --- Parse safely
    let parsed: unknown;
    try {
        parsed = JSON.parse(jsonText);
    } catch (error) {
        console.error("[ConvertPermissionsFromDatabase] ❌ Failed to parse permissions JSON:", error);
        return {};
    }

    // --- Validate structure
    if (!isValidPermissionRecord(parsed)) {
        console.warn("[ConvertPermissionsFromDatabase] ⚠️ Invalid permission structure received:", parsed);
        return {};
    }

    // --- Convert to standardized Permission structure
    const result: Permission = {};
    for (const [platform, actions] of Object.entries(parsed)) {
        result[platform] = Object.entries(actions).map(([key, access]) => ({
            key,
            access: Boolean(access),
        }));
    }

    return result;
}

/**
 * ✅ Type guard to validate expected permission object structure
 */
function isValidPermissionRecord(
    data: unknown
): data is Record<string, Record<string, boolean>> {
    if (!data || typeof data !== "object") return false;
    return Object.values(data).every(
        (actions) =>
            typeof actions === "object" &&
            actions !== null &&
            Object.values(actions).every((v) => typeof v === "boolean")
    );
}

/**
 * ✅ Transform deeply nested permission structure into simplified Permission format.
 *
 * Example Input:
 * {
 *   landlord: { view: { dashboard: true, reports: true }, edit: { users: false } },
 *   tenancy: { create: { contract: true }, delete: { contract: false } }
 * }
 *
 * Example Output:
 * {
 *   landlord: [
 *     { key: "view", access: true },
 *     { key: "edit", access: false }
 *   ],
 *   tenancy: [
 *     { key: "create", access: true },
 *     { key: "delete", access: false }
 *   ]
 * }
 */
export async function TransformPermissionsAsync(
    permissions: unknown
): Promise<Permission> {
    if (!permissions || typeof permissions !== "object") return {};

    const result: Permission = {};

    for (const [moduleName, actions] of Object.entries(permissions)) {
        if (!isValidActionGroup(actions)) continue;

        const transformed: PermissionAccess[] = Object.entries(actions).map(
            ([key, value]) => ({
                key,
                access: evaluateAccess(value),
            })
        );

        result[moduleName] = transformed;
    }

    return result;
}

/**
 * ✅ Ensure the permission module (landlord, tenancy, etc.)
 * has a valid object structure before processing.
 */
function isValidActionGroup(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * ✅ Flatten any nested boolean structure and compute an overall access value.
 *
 * Example:
 * { create: true, edit: false } => false
 * { dashboard: true, reports: true } => true
 */
function evaluateAccess(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "object" && value !== null) {
        const values = Object.values(value);
        return values.length > 0 && values.every(v => Boolean(v));
    }
    return false;
}
