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
import {v4 as uuidv4} from "uuid";
import {EntityUnit} from "../unit/unit.model"; // adjust path

@Entity("documents")
export class EntityDocument {
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
    title: string;

    @Column({type: "text", nullable: true})
    description: string | null;

    @Column({type: "varchar", length: 25, nullable: false})
    type: string;

    @Column({type: "int", nullable: false, default: 0})
    analyze_state: number;

    @Column({type: "text", nullable: true})
    file_path: string | null;

    @CreateDateColumn({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    created_at: Date;

    @UpdateDateColumn({type: "timestamp", nullable: true})
    updated_at: Date | null;

    @Column({type: "timestamp", nullable: true, default: null})
    deleted_at: Date | null;
}