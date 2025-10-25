import {Unit} from "./unit";

/**
 * ✅ Represents a contact entity (mirroring EntityContact)
 * enriched with related unit data.
 */
export interface Contact {
    id: string;
    unit_id: string;
    contact_person: string;
    company?: string | null;
    type: string;
    value: string;
    role?: string | null;
    craft?: string | null;
    created_at: Date;
    updated_at?: Date | null;
    deleted_at?: Date | null;

    /** Related Unit (loaded if joined/eager) */
    unit?: Unit | null;
}