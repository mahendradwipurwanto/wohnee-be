/**
 * ✅ Represents a tenant entity, mirroring the database model (EntityTenant)
 * and enriched with its one-to-one relation to tenant_data.
 */
export interface Tenant {
    /** Unique identifier for the tenant (UUID) */
    id: string;

    /** Foreign key linking to the organization that owns this tenant */
    org_id: string;

    /** Foreign key linking to the unit this tenant belongs to */
    unit_id: string;

    /** Tenant’s email address */
    email?: string | null;

    /** Tenant’s phone number */
    phone?: string | null;

    /** Tenant’s Telegram username or ID */
    telegram_id?: string | null;

    /** Preferred language (e.g., "en", "id") */
    lang?: string | null;

    /** JSON/text field for UI preferences or theme style */
    style?: string | null;

    /** Tenant account status (e.g. 0 = inactive, 1 = active) */
    status: number;

    /** Timestamp when tenant record was created */
    created_at: Date;

    /** Timestamp when tenant record was last updated */
    updated_at?: Date | null;

    /** Timestamp when tenant was soft-deleted */
    deleted_at?: Date | null;

    /** ✅ One-to-one relation: detailed tenant data */
    tenant_data?: TenantData | null;
}

/**
 * ✅ Represents the tenant_data entity,
 * containing profile details linked to a tenant.
 */
export interface TenantData {
    /** Unique identifier for the tenant_data record */
    id: string;

    /** Foreign key linking to the tenant */
    tenant_id: string;

    /** First name of the tenant */
    first_name?: string | null;

    /** Last name of the tenant */
    last_name?: string | null;

    /** Salutation or title (e.g., “Mr.”, “Mrs.”, “Dr.”) */
    salutation?: string | null;
}