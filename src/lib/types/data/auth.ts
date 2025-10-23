import {Permission} from "./role";

/**
 * ✅ Represents the JWT payload metadata stored in access & refresh tokens.
 * This structure defines what user information is embedded in each token.
 */
export interface TokenData {
    /** Unique identifier for the user or organization */
    id: string;

    /** Authentik identity provider user ID */
    authentik_userId: string;

    /** Access token from Authentik (or identity provider) */
    authentik_access_token: string;

    /** User or organization email */
    email: string;

    /** User or organization display name */
    name: string;

    /** User role name (e.g. "admin", "editor", "viewer") */
    role: string;

    /**
     * Role access type
     * 0 = all
     * 1 = mobile
     * 2 = admin
     * 3 = website
     */
    type: number;

    /** Object containing user role permissions */
    permissions: Permission;

    /** Token issuance timestamp (ISO or formatted string) */
    date: string;

    /** Token expiration timestamp (ISO or formatted string) */
    expired: string;
}