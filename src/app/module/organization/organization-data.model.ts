import {
    BeforeInsert,
    Column,
    Entity,
    JoinColumn,
    OneToOne, PrimaryColumn,
} from "typeorm";
import {EntityOrganization} from "./organization.model";

let uuidv4;
(async () => {
    const { v4 } = await import("uuid");
    uuidv4 = v4;
})();

@Entity("organization_data")
export class EntityOrganizationData {
    @PrimaryColumn({ type: "varchar", length: 36 })
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    // ✅ actual FK column
    @Column({type: "uuid", unique: true})
    org_id: string;

    // ✅ owning side with JoinColumn linking org_id → organizations.id
    @OneToOne(() => EntityOrganization, (org) => org.organization_data, {
        onDelete: "CASCADE",
    })
    @JoinColumn({name: "org_id", referencedColumnName: "id"})
    organization: EntityOrganization;

    @Column({type: "varchar", length: 50, nullable: true})
    email: string;

    @Column({type: "varchar", length: 50, nullable: true})
    name: string;

    @Column({type: "text", nullable: true})
    profile: string;

    @Column({type: "varchar", length: 100, nullable: true})
    phone: string;
}