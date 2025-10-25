import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn,
    BeforeInsert,
    OneToOne,
    ManyToOne,
    JoinColumn,
} from "typeorm";

let uuidv4;
(async () => {
    const { v4 } = await import("uuid");
    uuidv4 = v4;
})();
import {EntityTenantData} from "./tenant-data.model";
import {EntityUnit} from "../unit/unit.model";
import {EntityOrganization} from "../organization/organization.model";

@Entity("tenant")
export class EntityTenant {
    @PrimaryColumn({type: "varchar", length: 36})
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    // 👇 The organization that owns this tenant
    @Column({type: "varchar", length: 36, nullable: false})
    org_id: string;

    @ManyToOne(() => EntityOrganization, {eager: false})
    @JoinColumn({name: "org_id"})
    organization: EntityOrganization;

    // 👇 The unit this tenant belongs to
    @Column({type: "varchar", length: 36, nullable: false})
    unit_id: string;

    @ManyToOne(() => EntityUnit, {eager: false})
    @JoinColumn({name: "unit_id"})
    unit: EntityUnit;

    // 👇 Tenant main info
    @Column({type: "varchar", length: 100, nullable: true})
    email: string | null;

    @Column({type: "varchar", length: 100, nullable: true})
    phone: string | null;

    @Column({type: "varchar", length: 100, nullable: true})
    telegram_id: string | null;

    @Column({type: "varchar", length: 10, nullable: true})
    lang: string | null;

    @Column({type: "text", nullable: true})
    style: string | null;

    @Column({type: "int", nullable: false, default: 1})
    status: number;

    @CreateDateColumn({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    created_at: Date;

    @UpdateDateColumn({type: "timestamp", nullable: true})
    updated_at: Date | null;

    @Column({type: "timestamp", nullable: true, default: null})
    deleted_at: Date | null;

    // ✅ One-to-One relation to tenant_data
    @OneToOne(() => EntityTenantData, (tenant_data) => tenant_data.tenant, {eager: true})
    @JoinColumn({name: "id", referencedColumnName: "tenant_id"})
    tenant_data: EntityTenantData;
}