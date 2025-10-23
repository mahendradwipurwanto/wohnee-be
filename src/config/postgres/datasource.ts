import * as dotenv from "dotenv";
import fs from "fs";
import {resolve} from "path";
import {DataSource, DataSourceOptions} from "typeorm";
import {SeederOptions} from "typeorm-extension";

import {EntityOrganization} from "../../app/module/organization/organization.model";
import {EntityOrganizationData} from "../../app/module/organization/organization-data.model";
import {EntityRole} from "../../app/module/role/role.model";

// --- Load .env before using process.env
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

// --- Validate essential database env vars
const requiredEnv = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASS", "DB_NAME"];
for (const key of requiredEnv) {
    if (!process.env[key]) {
        console.warn(`⚠️ Missing environment variable: ${key}`);
    }
}

// --- Optional SSL configuration for production
let sslConfig: boolean | { ca: string; rejectUnauthorized: boolean } = false;
if (process.env.DB_CA) {
    try {
        sslConfig = {
            ca: fs.readFileSync(process.env.DB_CA).toString(),
            rejectUnauthorized: true,
        };
    } catch (err) {
        console.error("❌ Failed to read SSL CA file:", err);
    }
}

// --- Define base options
const options: DataSourceOptions & SeederOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: !isProduction, // enable logging only in dev
    synchronize: false, // never use true in production
    ssl: sslConfig,
    entities: [EntityOrganization, EntityOrganizationData, EntityRole],
    migrations: [resolve(__dirname, "migrations/**/*{.ts,.js}")],
    migrationsTableName: "typeorm_migrations",
    migrationsRun: false,
    seeds: [resolve(__dirname, "seeders/**/*{.ts,.js}")],
    seedTracking: true,
};

// --- Initialize datasource
export const AppDataSource = new DataSource(options);

// --- Optional: helper function to connect safely
export async function initializeDatabase(): Promise<void> {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("✅ PostgreSQL connection established successfully");
        }
    } catch (error) {
        console.error("❌ Failed to initialize PostgreSQL connection:", error);
        process.exit(1);
    }
}