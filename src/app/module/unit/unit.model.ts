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
import {EntityProperty} from "../property/property.model"; // adjust import path

@Entity("unit")
export class EntityUnit {
    @PrimaryColumn({type: "varchar", length: 36})
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    // ✅ Relation to Property
    @Column({type: "varchar", length: 36, nullable: false})
    property_id: string;

    @ManyToOne(() => EntityProperty, {eager: true})
    @JoinColumn({name: "property_id"})
    property: EntityProperty;

    @Column({type: "varchar", length: 100, nullable: false})
    name: string;

    @Column({type: "int", nullable: true})
    floor: number | null;

    @Column({type: "int", nullable: true})
    living_area: number | null;

    @CreateDateColumn({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    created_at: Date;

    @UpdateDateColumn({
        type: "timestamp",
        nullable: true,
    })
    updated_at: Date | null;

    @Column({type: "timestamp", nullable: true, default: null})
    deleted_at: Date | null;
}