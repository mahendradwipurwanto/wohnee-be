import {Unit} from "./unit";

/**
 * ✅ Represents a document entity (mirroring EntityDocument)
 * enriched with related unit data.
 */
export interface Document {
    id: string;
    unit_id: string;
    title: string;
    description?: string | null;
    type: string;
    analyze_state: number;
    file_path?: string | null;
    created_at: Date;
    updated_at?: Date | null;
    deleted_at?: Date | null;

    /** Related Unit (loaded if joined/eager) */
    unit?: Unit | null;
}