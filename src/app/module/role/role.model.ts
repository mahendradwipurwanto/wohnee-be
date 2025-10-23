import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import {EntityOrganization} from "../organization/organization.model";
import {Permission} from "../../../lib/types/data/role";

/**
 * ✅ EntityRole — Defines RBAC roles with hierarchical structure
 */
@Entity({name: "roles"})
@Index("idx_role_name_unique", ["name"], {unique: true})
export class EntityRole {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "varchar", length: 50, nullable: false})
    name!: string;

    /**
     * JSON-based permissions object.
     * Example:
     * {
     *   "dashboard": ["read"],
     *   "users": ["read", "write", "delete"]
     * }
     */
    @Column({type: "jsonb", nullable: false})
    permissions!: Permission;

    /**
     * Access type (0: all, 1: mobile, 2: admin, 3: website)
     */
    @Column({
        type: "int",
        default: 3,
        nullable: false,
        comment: "0: all, 1: mobile, 2: admin, 3: website",
    })
    access!: number;

    @Column({type: "boolean", default: false, nullable: false})
    is_default!: boolean;

    @Column({type: "uuid", nullable: true})
    parent_id?: string;

    /**
     * Self-referential parent-child relationship
     */
    @ManyToOne(() => EntityRole, (role) => role.children, {
        nullable: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    })
    @JoinColumn({name: "parent_id"})
    parent?: EntityRole;

    @OneToMany(() => EntityRole, (role) => role.parent)
    children?: EntityRole[];

    /**
     * Role associations with organizations
     */
    @OneToMany(() => EntityOrganization, (organization) => organization.role)
    organizations?: EntityOrganization[];

    @CreateDateColumn({
        type: "timestamptz",
        default: () => "CURRENT_TIMESTAMP",
        nullable: false,
    })
    created_at!: Date;

    @UpdateDateColumn({type: "timestamptz", nullable: true})
    updated_at?: Date;

    @DeleteDateColumn({type: "timestamptz", nullable: true})
    deleted_at?: Date;
}