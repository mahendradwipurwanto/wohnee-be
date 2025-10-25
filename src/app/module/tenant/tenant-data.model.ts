import {Entity, Column, PrimaryColumn, BeforeInsert, OneToOne, JoinColumn} from "typeorm";
import {v4 as uuidv4} from "uuid";
import {EntityTenant} from "./tenant.model";

@Entity("tenant_data")
export class EntityTenantData {
    @PrimaryColumn({type: "varchar", length: 36})
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    @Column({type: "varchar", length: 36, nullable: false})
    tenant_id: string;

    @Column({type: "varchar", length: 100, nullable: true})
    first_name: string | null;

    @Column({type: "varchar", length: 100, nullable: true})
    last_name: string | null;

    @Column({type: "text", nullable: true})
    salutation: string | null;

    @OneToOne(() => EntityTenant, (tenant) => tenant.tenant_data)
    @JoinColumn({name: "tenant_id"})
    tenant: EntityTenant;
}