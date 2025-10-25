import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn,
    BeforeInsert,
    ManyToOne,
    JoinColumn,
} from "typeorm";

let uuidv4;
(async () => {
    const { v4 } = await import("uuid");
    uuidv4 = v4;
})();
import {EntityUnit} from "../unit/unit.model"; // adjust path

@Entity("contacts")
export class EntityContact {
    @PrimaryColumn({type: "varchar", length: 36})
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    // ✅ Relation to Unit
    @Column({type: "varchar", length: 36, nullable: false})
    unit_id: string;

    @ManyToOne(() => EntityUnit, {eager: true})
    @JoinColumn({name: "unit_id"})
    unit: EntityUnit;

    @Column({type: "varchar", length: 100, nullable: false})
    contact_person: string;

    @Column({type: "varchar", length: 100, nullable: true})
    company: string | null;

    @Column({type: "varchar", length: 15, nullable: false})
    type: string; // e.g. "email", "phone", "whatsapp"

    @Column({type: "varchar", length: 50, nullable: false})
    value: string;

    @Column({type: "text", nullable: true})
    role: string | null;

    @Column({type: "text", nullable: true})
    craft: string | null;

    @CreateDateColumn({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    created_at: Date;

    @UpdateDateColumn({type: "timestamp", nullable: true})
    updated_at: Date | null;

    @Column({type: "timestamp", nullable: true, default: null})
    deleted_at: Date | null;
}