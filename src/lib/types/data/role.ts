/**
 * ✅ Represents a Role entity — defines access control for an organization or user.
 * Mirrors your database model (`EntityRole`).
 */
export interface RoleData {
    /** Unique identifier for the role (UUID) */
    id: string;

    /** Human-readable name of the role (e.g., "Admin", "Editor") */
    name: string;

    /** List of permissions assigned to this role */
    permissions: Permission;

    /**
     * Access level:
     * 0 = all
     * 1 = mobile
     * 2 = admin
     * 3 = website
     */
    access: number;

    /** Whether this role is the default role */
    is_default: boolean;

    /** Parent role ID (used for hierarchical role inheritance) */
    parent_id?: string;

    /** Creation timestamp */
    created_at: Date;

    /** Last updated timestamp */
    updated_at: Date;

    /** Optional deletion timestamp (for soft delete) */
    deleted_at?: Date;
}

/**
 * ✅ Defines the full permission set structure for a role.
 * Each key (e.g. `landlord`, `tenancy`) maps to a list of actions.
 */
export interface Permission {
    [module: string]: PermissionAccess[]; // dynamic support for future modules
}

/**
 * ✅ Represents a single action permission entry.
 * Example: `{ key: "edit_user", access: true }`
 */
export interface PermissionAccess {
    /** Permission key (e.g., "view", "edit", "delete") */
    key: string;

    /** Whether access is granted (`true`) or denied (`false`) */
    access: boolean;
}