import express from "express";
import * as dotenv from "dotenv";
import {App} from "./app";
import {AppDataSource} from "./config/postgres/datasource";
import loggerHandler from "./lib/helper/loggerHandler";

// Load environment variables for non-production environments
if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}

async function startServer(): Promise<void> {
    const app = express();
    const mainApp = new App();

    const PORT = process.env.PORT || 8080;
    const NODE_ENV = process.env.NODE_ENV || "development";

    try {
        // Validate critical configuration
        if (!process.env.DATABASE_URL && !AppDataSource.options.database) {
            throw new Error("Missing DATABASE_URL or database config in .env");
        }

        // Trust proxy (important for rate limiter / reverse proxies)
        app.set("trust proxy", 1);

        // Setup Express layers
        mainApp.SetupMiddleware(app);
        mainApp.SetupRoutes(app);
        mainApp.SetupErrorHandling(app);

        // Initialize Database
        loggerHandler.info("⏳ Connecting to PostgreSQL...");
        await AppDataSource.initialize();
        loggerHandler.info("✅ Database connected successfully.");

        // Start Express server
        const server = app.listen(PORT, () => {
            loggerHandler.info(`🚀 Server running on port ${PORT} (${NODE_ENV} mode)`);
        });

        // Graceful shutdown handler
        const shutdown = async (signal: string) => {
            loggerHandler.warn(`⚠️ Received ${signal}, shutting down gracefully...`);
            server.close(async () => {
                loggerHandler.info("🛑 HTTP server closed.");
                try {
                    await AppDataSource.destroy();
                    loggerHandler.info("📦 Database connection closed.");
                } catch (dbError) {
                    loggerHandler.error(`❌ Error closing database: ${dbError}`);
                } finally {
                    process.exit(0);
                }
            });
        };

        process.on("SIGINT", () => shutdown("SIGINT"));
        process.on("SIGTERM", () => shutdown("SIGTERM"));
    } catch (error: any) {
        loggerHandler.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

// Start app
startServer();