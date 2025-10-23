import {
    Column,
    CreateDateColumn,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    JoinColumn,
    ManyToOne,
} from "typeorm";
import {EntityOrganizationData} from "./organization-data.model";
import {EntityRole} from "../role/role.model";

@Entity("organizations")
export class EntityOrganization {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({type: "varchar", unique: true})
    authentik_userId: string;

    @Column({type: "varchar", nullable: true})
    authentik_access_token: string;

    @Column({type: "varchar", nullable: true})
    refresh_token: string;

    @Column({type: "timestamptz", nullable: true})
    last_login: Date;

    @Column({type: "int", default: 1})
    status: number;

    @CreateDateColumn({type: "timestamptz"})
    created_at: Date;

    @UpdateDateColumn({type: "timestamptz"})
    updated_at: Date;

    // ✅ FIX: this side does NOT have JoinColumn
    @OneToOne(() => EntityOrganizationData, (data) => data.organization, {
        cascade: true,
        eager: true,
    })
    organization_data: EntityOrganizationData;

    @ManyToOne(() => EntityRole, (role) => role.organizations, {eager: true})
    @JoinColumn({name: "role_id"})
    role: EntityRole;
}