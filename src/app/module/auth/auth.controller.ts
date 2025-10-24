import {Router, Request, Response, NextFunction} from "express";
import ValidatorMiddleware from "../../middleware/validator.middleware";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";
import logger from "../../../lib/helper/loggerHandler";
import {SignInDto} from "./auth.dto";
import {OrganizationService} from "../organization/organization.service";
import {TokenJwtVerification} from "../../../lib/auth/token";
import {generateTokenJWT} from "../../../lib/helper/authHandler";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";

/**
 * ✅ Authentication Controller
 * Handles sign-in and sign-out logic using Authentik integration
 */
export class AuthController {
    public readonly router: Router;

    constructor(private readonly organizationService: OrganizationService) {
        this.router = Router();
        this.initializeRoutes();
    }

    /**
     * Initialize all authentication-related routes
     */
    private initializeRoutes(): void {
        this.router.post("/sign-in", ValidatorMiddleware(SignInDto), this.signIn);
        this.router.post("/sign-out", this.signOut);
    }

    /**
     * ✅ POST /auth/sign-in
     * Sign in or auto-register an organization via Authentik
     */
    private signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const payload: SignInDto = req.body;

        try {
            if (!payload.authentik_userId) {
                throw new CustomHttpExceptionError("authentik_userId is required", 400);
            }

            // 1️⃣ Try fetching even deleted orgs
            let organization = await this.organizationService.GetOrgByParams(
                {authentik_userId: payload.authentik_userId},
                'AND',
                true // include deleted
            );

            console.log('Fetched organization:', organization);

            if (organization?.deleted_at !== null) {
                // 2️⃣ Restore soft-deleted org
                await this.organizationService.restoreData(organization.id);

                // Optionally refresh reference after restore
                organization = await this.organizationService.GetOrgByParams(
                    {authentik_userId: payload.authentik_userId},
                    "AND"
                );

                logger.info(
                    `[AuthController] ♻️ Restored soft-deleted organization: ID=${organization.id}, Email=${payload.authentik_userEmail}`
                );
            } else if (!organization) {
                // 3️⃣ Create new org if not exist at all
                organization = await this.organizationService.createData(payload);
                logger.info(`[AuthController] ✅ Created new organization: ID=${organization.id}`);
            }

            const tokenData = await generateTokenJWT(organization, this.organizationService);

            ResponseSuccessBuilder(res, 200, "Sign-in successful", tokenData);
        } catch (error: any) {
            logger.error(`[AuthController:signIn] ❌ Sign-in failed: ${error.message}`, {
                route: req.originalUrl,
                authentik_userId: payload.authentik_userId,
                stack: error.stack,
            });
            next(error);
        }
    };

    /**
     * ✅ POST /auth/sign-out
     * Revoke access and refresh tokens to terminate session
     */
    private signOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const refreshToken = req.headers["x-refresh-token"] as string;
            const accessToken = req.headers["authorization"]?.replace("Bearer ", "") as string;

            if (!refreshToken || !accessToken) {
                throw new CustomHttpExceptionError("Missing authentication tokens", 400);
            }

            // ✅ Verify refresh token
            const metadata = await TokenJwtVerification(refreshToken, true);

            // ✅ Delete or revoke tokens from database
            await this.organizationService.DeleteAccessToken(metadata.id, accessToken, refreshToken);

            ResponseSuccessBuilder(res, 200, "Sign-out successful", null);
        } catch (error: any) {
            logger.error(`[AuthController:signOut] ❌ Sign-out failed: ${error.message}`, {
                route: req.originalUrl,
                stack: error.stack,
            });
            next(error);
        }
    };
}