import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity('faq')
export class EntityFaq {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 255, nullable: false})
    faq: string;

    @Column({type: 'varchar', length: 255, nullable: false})
    answer: string;

    @Column({type: 'varchar', length: 255, nullable: false})
    faq_category_id: string;

    @CreateDateColumn({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false})
    created_at: Date;

    @UpdateDateColumn({type: 'timestamp', nullable: true})
    updated_at: Date | null;

    @Column({type: 'varchar', length: 30, nullable: true, default: null})
    deleted_at: string | null;
}