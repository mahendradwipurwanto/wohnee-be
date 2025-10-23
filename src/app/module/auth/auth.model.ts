import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Index,
    UpdateDateColumn,
} from "typeorm";

/**
 * ✅ TokenAuth Entity
 * Stores user refresh tokens for session management.
 */
@Entity({name: "token_auth"})
@Index("idx_token_user_id", ["user_id"], {unique: true})
export class TokenAuth {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "uuid", nullable: false})
    @Index("idx_user_id")
    user_id!: string;

    @Column({type: "text", nullable: false})
    refresh_token!: string;

    @Column({type: "varchar", length: 64, nullable: false})
    ip_address!: string;

    @CreateDateColumn({type: "timestamptz"})
    created_at!: Date;

    @UpdateDateColumn({type: "timestamptz"})
    updated_at!: Date;
}

/**
 * ✅ Otp Entity
 * Stores generated OTP codes with timestamp for validation and expiry handling.
 */
@Entity({name: "otps"})
@Index("idx_otp_metadata", ["metadata"], {unique: true})
export class Otp {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({type: "varchar", length: 255, nullable: false})
    metadata!: string;

    @Column({type: "int", nullable: false})
    code!: number;

    @CreateDateColumn({type: "timestamptz"})
    created_at!: Date;

    @Column({type: "timestamptz", nullable: true})
    expires_at?: Date;
}