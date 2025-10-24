import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn, PrimaryColumn, BeforeInsert, ManyToOne, JoinColumn,
} from "typeorm";
import {v4 as uuidv4} from "uuid";
import {EntityCountries} from "../countries/countries.model";

@Entity("property")
export class EntityProperty {
    @PrimaryColumn({type: "varchar", length: 36})
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    @Column({type: "varchar", length: 36, nullable: false})
    org_id: string;

    @Column({type: "varchar", length: 100, nullable: false})
    name: string;

    @Column({type: "varchar", length: 100, nullable: false})
    country_id: string;

    // ✅ Relation to EntityCountry
    @ManyToOne(() => EntityCountries, {eager: true}) // eager optional
    @JoinColumn({name: "country_id"})
    country: EntityCountries;

    @Column({type: "varchar", length: 100, nullable: true})
    city: string | null;

    @Column({type: "text", nullable: true})
    street: string | null;

    @Column({type: "text", nullable: true})
    housenumber: string | null;

    @Column({type: "varchar", length: 25, nullable: true})
    zip_code: string | null;

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