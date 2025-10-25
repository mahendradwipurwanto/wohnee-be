import {Property} from "./property";

/**
 * ✅ Represents a unit entity, mirroring the database model (EntityUnit)
 * and enriched with its relationship to a property.
 */
export interface Unit {
    /** Unique identifier of the unit (UUID) */
    id: string;

    /** Foreign key linking to the parent property */
    property_id: string;

    /** Name or label of the unit (e.g., “Unit 1A”, “Room 203”) */
    name: string;

    /** Floor number (optional) */
    floor?: number | null;

    /** Living area in square meters (optional) */
    living_area?: number | null;

    /** Date when the record was created */
    created_at: Date;

    /** Date when the record was last updated */
    updated_at?: Date | null;

    /** Date when the record was soft-deleted */
    deleted_at?: Date | null;

    /** Related property details (if joined or eager-loaded) */
    property?: Property | null;
}