import { Router, Request, Response, NextFunction } from "express";
import ValidatorMiddleware from "../../middleware/validator.middleware";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import logger from "../../../lib/helper/loggerHandler";
import { SignInDto } from "./auth.dto";
import { OrganizationService } from "../organization/organization.service";
import { TokenJwtVerification } from "../../../lib/auth/token";
import { generateTokenJWT } from "../../../lib/helper/authHandler";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";

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
     * @swagger
     * tags:
     *   name: Authentication
     *   description: Endpoints related to user authentication and token lifecycle
     */

    /**
     * @swagger
     * /auth/sign-in:
     *   post:
     *     summary: Sign in or auto-register an organization via Authentik
     *     description: Authenticates user through Authentik tokens. If organization doesn't exist, it creates one automatically. Also restores soft-deleted organizations.
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *       - XSignatureAuth: []
     *       - XDateHeader: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - authentik_accessToken
     *               - authentik_userId
     *               - authentik_userEmail
     *             properties:
     *               authentik_accessToken:
     *                 type: string
     *                 example: "fv686R2UygKA0oGzwxDzMp2OZtSmSsF4f6KGy11t8"
     *               authentik_userId:
     *                 type: string
     *                 example: "ac0cb8e0-be5b-4bb2-9427-079c69931a05"
     *               authentik_userEmail:
     *                 type: string
     *                 example: "mahendradwipurwanto@gmail.com"
     *               authentik_name:
     *                 type: string
     *                 example: "Mahendra Immich App"
     *     responses:
     *       200:
     *         description: Successful sign-in. Returns access and refresh tokens.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 responseCode:
     *                   type: integer
     *                   example: 200
     *                 responseDesc:
     *                   type: string
     *                   example: Successful
     *                 message:
     *                   type: string
     *                   example: Sign-in successful
     *                 data:
     *                   type: object
     *                   properties:
     *                     access_token:
     *                       type: string
     *                       example: "eyJhbGciOiJIUzI1NiIs..."
     *                     refresh_token:
     *                       type: string
     *                       example: "eyJhbGciOiJIUzI1NiIs..."
     *                     data:
     *                       type: object
     *                       properties:
     *                         id:
     *                           type: string
     *                           example: "be46dadf-3336-487a-b638-07f3c01de91d"
     *       400:
     *         description: Validation failed
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 responseCode:
     *                   type: integer
     *                   example: 400
     *                 message:
     *                   type: string
     *                   example: authentik_userId is required
     *       401:
     *         description: Invalid signature or JWT
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 responseCode:
     *                   type: integer
     *                   example: 401
     *                 message:
     *                   type: string
     *                   example: Invalid token signature
     */
    private signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const payload: SignInDto = req.body;

        try {
            if (!payload.authentik_userId) {
                throw new CustomHttpExceptionError("authentik_userId is required", 400);
            }

            let organization = await this.organizationService.GetOrgByParams(
                { authentik_userId: payload.authentik_userId },
                'AND',
                true
            );

            if (organization?.deleted_at !== null) {
                await this.organizationService.restoreData(organization.id);
                organization = await this.organizationService.GetOrgByParams(
                    { authentik_userId: payload.authentik_userId },
                    "AND"
                );
                logger.info(`[AuthController] ♻️ Restored soft-deleted organization: ID=${organization.id}`);
            } else if (!organization) {
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
     * @swagger
     * /auth/sign-out:
     *   post:
     *     summary: Sign out and revoke active tokens
     *     description: Revokes both access and refresh tokens, terminating user session.
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: header
     *         name: x-refresh-token
     *         schema:
     *           type: string
     *         required: true
     *         description: Refresh token for the current session
     *       - in: header
     *         name: Authorization
     *         schema:
     *           type: string
     *           example: Bearer <access_token>
     *         required: true
     *         description: Active JWT access token
     *     responses:
     *       200:
     *         description: Sign-out successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 responseCode:
     *                   type: integer
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Sign-out successful
     *       400:
     *         description: Missing authentication tokens
     *       401:
     *         description: Invalid or expired tokens
     */
    private signOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const refreshToken = req.headers["x-refresh-token"] as string;
            const accessToken = req.headers["authorization"]?.replace("Bearer ", "") as string;

            if (!refreshToken || !accessToken) {
                throw new CustomHttpExceptionError("Missing authentication tokens", 400);
            }

            const metadata = await TokenJwtVerification(refreshToken, true);
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