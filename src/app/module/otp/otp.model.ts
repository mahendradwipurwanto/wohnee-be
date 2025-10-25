import {
    Entity,
    Column,
    PrimaryColumn,
    BeforeInsert,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import {v4 as uuidv4} from "uuid";
import {EntityTenant} from "../tenant/tenant.model";

@Entity("otp")
export class EntityOtp {
    @PrimaryColumn({type: "varchar", length: 36})
    id: string;

    @BeforeInsert()
    setId() {
        if (!this.id) this.id = uuidv4();
    }

    @Column({type: "varchar", length: 36, nullable: false})
    tenant_id: string;

    @ManyToOne(() => EntityTenant, {eager: false})
    @JoinColumn({name: "tenant_id"})
    tenant: EntityTenant;

    @Column({type: "varchar", length: 20, nullable: false})
    otp: string;

    @Column({type: "timestamp", nullable: false})
    expired_at: Date;

    @Column({type: "int", default: 0}) // 0 = unused, 1 = used, 2 = expired
    status: number;

    @Column({type: "timestamp", nullable: true})
    deleted_at: Date | null;
}