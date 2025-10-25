import {RoleData} from "./role";

/**
 * ✅ Represents an organization entity, mirroring the database model (EntityOrganization)
 * and enriched with related role and metadata.
 */
export interface Organization {
    /** Unique identifier of the organization (UUID) */
    id: string;

    /** Linked Authentik or external identity user ID (if applicable) */
    authentik_userId?: string | null;

    /** Access token issued by Authentik or identity provider */
    authentik_access_token?: string | null;

    /** Timestamp of the last login activity */
    last_login?: Date | null;

    /** Role assigned to this organization (relation to `EntityRole`) */
    role: RoleData;

    /**
     * Status flag
     * 0 = inactive / deleted
     * 1 = active
     * 2 = suspended
     * Extendable for future statuses (e.g., pending, archived)
     */
    status: number;

    /** Date the record was created */
    created_at: Date;

    /** Date the record was last updated */
    updated_at: Date;

    /** Date the record was last deleted */
    deleted_at: Date;

    /** Optional extended organization data */
    organization_data?: OrganizationData | null;
}

/**
 * ✅ Represents additional metadata stored in a separate table (EntityOrganizationData)
 */
export interface OrganizationData {
    /** Primary key of the organization_data record */
    id: string;

    /** Foreign key linking to `Organization.id` */
    org_id: string;

    /** Primary email contact for the organization */
    email?: string | null;

    /** Display name of the organization */
    name?: string | null;

    /** Profile picture URL or storage path */
    profile?: string | null;

    /** Contact phone number */
    phone?: string | null;
}