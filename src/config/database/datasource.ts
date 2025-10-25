import * as dotenv from "dotenv";
import {resolve} from "path";
import {DataSource, DataSourceOptions} from "typeorm";
import {SeederOptions} from "typeorm-extension";

import {EntityOrganization} from "../../app/module/organization/organization.model";
import {EntityOrganizationData} from "../../app/module/organization/organization-data.model";
import {EntityRole} from "../../app/module/role/role.model";
import {EntityProperty} from "../../app/module/property/property.model";
import {EntityCountries} from "../../app/module/countries/countries.model";
import {EntityUnit} from "../../app/module/unit/unit.model";
import {EntityDocument} from "../../app/module/document/document.model";
import {EntityContact} from "../../app/module/contact/contact.model";
import {EntityTenant} from "../../app/module/tenant/tenant.model";
import {EntityTenantData} from "../../app/module/tenant/tenant-data.model";
import {EntityOtp} from "../../app/module/otp/otp.model";

// --- Load environment variables
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";
const shouldAutoSync = process.env.AUTO_SYNC_DB === "true";

// --- Validate required environment variables
const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASS", "DB_NAME"];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.warn(`⚠️ Missing environment variable: ${key}`);
    }
}

// --- Base TypeORM options
const options: DataSourceOptions & SeederOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: !isProduction && ['query', 'error'], // only log queries in development
    synchronize: shouldAutoSync, // never use true in production
    ssl: {rejectUnauthorized: false},
    entities: [EntityOrganization, EntityOrganizationData, EntityRole, EntityProperty, EntityCountries, EntityUnit, EntityDocument, EntityContact, EntityTenant, EntityTenantData, EntityOtp],
    migrations: [resolve(__dirname, "migrations/**/*{.ts,.js}")],
    migrationsTableName: "typeorm_migrations",
    migrationsRun: false,
    seeds: [resolve(__dirname, "seeders/**/*{.ts,.js}")],
    seedTracking: true,
};

// --- Export DataSource
export const AppDataSource = new DataSource(options);