import express, {Application} from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import {AppDataSource} from "../config/postgres/datasource";
import {ErrorHandler} from "../lib/helper/errorHandler";
import loggerHandler from "../lib/helper/loggerHandler";

import {VerifyJwtToken} from "./middleware/auth.middleware";
import {VerifyRequestSignature} from "./middleware/signature.middleware";

import {AuthController} from "./module/auth/auth.controller";
import {EntityOrganization} from "./module/organization/organization.model";
import {FilesController} from "./module/files/files.controller";
import {OrganizationService} from "./module/organization/organization.service";
import {EntityRole} from "./module/role/role.model";
import {RoleService} from "./module/role/role.service";

const prefix = process.env.API_PREFIX || "/api/v1";
const env = process.env.NODE_ENV || "development";

loggerHandler.info(`🚀 Running in ${env} mode`);

export class App {
    /**
     * ✅ Setup global middlewares
     */
    public SetupMiddleware(app: Application): void {
        // --- Security headers (Helmet)
        app.use(helmet({
            crossOriginResourcePolicy: {policy: "cross-origin"},
        }));

        // --- CORS
        const corsOrigins = process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"];
        app.use(
            cors({
                origin: corsOrigins,
                methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                credentials: true,
                optionsSuccessStatus: 200,
            })
        );

        // --- Body parsers
        app.use(express.json({limit: "10mb"}));
        app.use(express.urlencoded({extended: true, limit: "10mb"}));

        // --- Request compression for performance
        app.use(compression());

        // --- HTTP request logging (Morgan + Winston)
        if (env !== "production") {
            app.use(morgan("dev"));
        } else {
            app.use(
                morgan("combined", {
                    stream: {
                        write: (message) => loggerHandler.http(message.trim()),
                    },
                })
            );
        }

        // --- Auth and Signature verification
        app.use(VerifyJwtToken(prefix));
        app.use(VerifyRequestSignature());
    }

    /**
     * ✅ Setup application routes
     */
    public SetupRoutes(app: Application): void {
        // --- Dependency injection
        const roleService = new RoleService(AppDataSource.getRepository(EntityRole));
        const organizationService = new OrganizationService(
            AppDataSource.getRepository(EntityOrganization),
            roleService
        );

        // --- Controllers
        const authController = new AuthController(organizationService);
        const fileController = new FilesController();

        // --- Route registration
        app.use(`${prefix}/auth`, authController.router);
        app.use(`/files`, fileController.router);

        // --- Health check route
        app.get(`${prefix}/health`, (_req, res) => {
            res.status(200).json({status: "OK", environment: env, timestamp: new Date().toISOString()});
        });
    }

    /**
     * ✅ Setup centralized error handling middleware
     */
    public SetupErrorHandling(app: Application): void {
        app.use(ErrorHandler);
    }
}