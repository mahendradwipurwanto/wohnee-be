import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertDefaultRoles1720000001000 implements MigrationInterface {
    name = "InsertDefaultRoles1720000001000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO roles (id, name, permissions, access, is_default, created_at)
            VALUES
                (
                    gen_random_uuid(),
                    'Landlord',
                    '{
                        "auth": ["read", "write", "delete"],
                        "contact": ["read", "write", "delete"],
                        "countries": ["read", "write", "delete"],
                        "document": ["read", "write", "delete"],
                        "files": ["read", "write", "delete"],
                        "organization": ["read", "write", "delete"],
                        "otp": ["read", "write", "delete"],
                        "property": ["read", "write", "delete"],
                        "role": ["read", "write", "delete"],
                        "tenant": ["read", "write", "delete"],
                        "unit": ["read", "write", "delete"]
                    }',
                    3,
                    true,
                    NOW()
                ),
                (
                    gen_random_uuid(),
                    'Tenant',
                    '{
                        "tenant": ["read", "write"],
                        "otp": ["read", "write"]
                    }',
                    3,
                    false,
                    NOW()
                );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM roles WHERE name IN ('Landlord', 'Tenant');
        `);
    }
}