/**
 * ✅ Represents a property entity, mirroring the database model (EntityProperty)
 * and enriched with its relationships to country, organization, and property type.
 */
export interface Property {
    /** Unique identifier for the property (UUID) */
    id: string;

    /** Foreign key linking to the owning organization */
    org_id: string;

    /** Name or label of the property (e.g. “Warehouse A”, “Villa Ubud”) */
    name: string;

    /** Foreign key linking to the country where the property is located */
    country_id: string;

    /** Name of the city where the property is located */
    city?: string | null;

    /** Street or area name */
    street?: string | null;

    /** House number or block information */
    housenumber?: string | null;

    /** Postal or ZIP code */
    zip_code?: string | null;

    /** Timestamp when the property was created */
    created_at: Date;

    /** Timestamp when the property was last updated */
    updated_at?: Date | null;

    /** Timestamp when the property was deleted (soft delete) */
    deleted_at?: Date | null;
}