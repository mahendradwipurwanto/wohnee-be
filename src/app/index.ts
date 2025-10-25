import express, {Application} from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import {AppDataSource} from "../config/database/datasource";
import {ErrorHandler} from "../lib/helper/errorHandler";
import loggerHandler from "../lib/helper/loggerHandler";

import swaggerUi from "swagger-ui-express";
import {swaggerSpec} from "../config/swagger";

import {VerifyJwtToken} from "./middleware/auth.middleware";
import {VerifyRequestSignature} from "./middleware/signature.middleware";

import {AuthController} from "./module/auth/auth.controller";
import {EntityOrganization} from "./module/organization/organization.model";
import {FilesController} from "./module/files/files.controller";
import {OrganizationService} from "./module/organization/organization.service";
import {EntityRole} from "./module/role/role.model";
import {RoleService} from "./module/role/role.service";
import {OrganizationController} from "./module/organization/organization.controller";
import {PropertyController} from "./module/property/property.controller";
import {PropertyService} from "./module/property/property.service";
import {EntityProperty} from "./module/property/property.model";
import {CountriesController} from "./module/countries/countries.controller";
import {CountriesService} from "./module/countries/countries.service";
import {EntityCountries} from "./module/countries/countries.model";
import {UnitController} from "./module/unit/unit.controller";
import {UnitService} from "./module/unit/unit.service";
import {EntityUnit} from "./module/unit/unit.model";
import {DocumentService} from "./module/document/document.service";
import {EntityDocument} from "./module/document/document.model";
import {DocumentController} from "./module/document/document.controller";
import {ContactController} from "./module/contact/contact.controller";
import {EntityContact} from "./module/contact/contact.model";
import {ContactService} from "./module/contact/contact.service";
import {TenantController} from "./module/tenant/tenant.controller";
import {EntityTenant} from "./module/tenant/tenant.model";
import {TenantService} from "./module/tenant/tenant.service";
import {OtpController} from "./module/otp/otp.controller";
import {EntityOtp} from "./module/otp/otp.model";
import {OtpService} from "./module/otp/otp.service";

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
        app.use(VerifyRequestSignature(prefix));
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
        const propertyService = new PropertyService(
            AppDataSource.getRepository(EntityProperty)
        );
        const countriesService = new CountriesService(
            AppDataSource.getRepository(EntityCountries)
        );
        const unitService = new UnitService(
            AppDataSource.getRepository(EntityUnit)
        );
        const documentService = new DocumentService(
            AppDataSource.getRepository(EntityDocument)
        );
        const contactService = new ContactService(
            AppDataSource.getRepository(EntityContact)
        );
        const tenantService = new TenantService(
            AppDataSource.getRepository(EntityTenant)
        );
        const otpService = new OtpService(
            AppDataSource.getRepository(EntityOtp)
        );

        // --- Controllers
        const authController = new AuthController(organizationService);
        const organizationController = new OrganizationController(organizationService);
        const propertyController = new PropertyController(propertyService);
        const countriesController = new CountriesController(countriesService);
        const unitController = new UnitController(unitService, propertyService);
        const documentController = new DocumentController(documentService, unitService);
        const contactController = new ContactController(contactService, unitService);
        const tenantController = new TenantController(tenantService, unitService, organizationService);
        const otpController = new OtpController(otpService, tenantService);

        // --- File Controller
        const fileController = new FilesController();

        // Swagger UI endpoint
        app.use(`${prefix}/docs/`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        // --- Route registration
        app.use(`${prefix}/auth`, authController.router);
        app.use(`${prefix}/organization`, organizationController.router);
        app.use(`${prefix}/property`, propertyController.router);
        app.use(`${prefix}/countries`, countriesController.router);
        app.use(`${prefix}/unit`, unitController.router);
        app.use(`${prefix}/document`, documentController.router);
        app.use(`${prefix}/contact`, contactController.router);
        app.use(`${prefix}/tenant`, tenantController.router);
        app.use(`${prefix}/otp`, otpController.router);

        // --- File management routes
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