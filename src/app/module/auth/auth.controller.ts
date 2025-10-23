import {Router} from "express";
import ValidatorMiddleware from "../../middleware/validator.middleware";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";
import loggerHandler from "../../../lib/helper/loggerHandler";
import {SignInDto} from "./auth.dto";
import {OrganizationService} from "../organization/organization.service";
import {TokenJwtVerification} from "../../../lib/auth/token";
import {generateTokenJWT} from "../../../lib/helper/authHandler";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";

export class AuthController {
    public router: Router;
    private organizationService: OrganizationService;

    constructor(organizationService: OrganizationService) {
        this.router = Router();
        this.organizationService = organizationService;
        this.initializeRoutes();
    }

    /**
     * Initialize all controller routes
     */
    private initializeRoutes() {
        this.router.post("/sign-in", ValidatorMiddleware(SignInDto), this.signIn);
        this.router.post("/sign-out", this.signOut);
    }

    /**
     * @route POST /auth/sign-in
     * @desc Sign in or auto-register organization via authentik_userId
     */
    private signIn = async (req: any, res: any, next: any): Promise<void> => {
        try {
            const payload: SignInDto = req.body;

            if (!payload.authentik_userId) {
                throw new CustomHttpExceptionError("authentik_userId is required", 400);
            }

            // ✅ Attempt to find organization by Authentik user ID
            let organization = await this.organizationService.GetOrgByParams({
                organization: {authentik_userId: payload.authentik_userId}
            });

            // ✅ Auto-register if not found
            if (!organization) {
                const createdOrg = await this.organizationService.createData(payload);
                loggerHandler.info(`[Org] Created new organization: ID=${createdOrg.id}, Name=${createdOrg.organization_data.name}, Email=${createdOrg.organization_data.email}`);

                // ✅ Retrieve created organization for token generation
                organization = await this.organizationService.GetOrgByParams({
                    organization: {authentik_userId: payload.authentik_userId}
                });

                if (!organization) {
                    throw new CustomHttpExceptionError("Failed to retrieve newly created organization record", 500);
                }
            }

            // ✅ Generate signed JWT
            const tokenData = await generateTokenJWT(organization, this.organizationService);

            loggerHandler.info(`[Auth] Sign-in successful for OrgID=${organization.id}`);

            return ResponseSuccessBuilder(res, 200, "Success", tokenData);
        } catch (error) {
            loggerHandler.error(`[Auth] Sign-in failed: ${error.message}`, {stack: error.stack});
            next(error);
        }
    };

    /**
     * @route POST /auth/sign-out
     * @desc Invalidate tokens and end session
     */
    private signOut = async (req: any, res: any, next: any): Promise<void> => {
        try {
            const refreshToken = req.refresh_token;
            const accessToken = req.authentik_accessToken;

            if (!refreshToken || !accessToken) {
                throw new CustomHttpExceptionError("Missing authentication tokens", 400);
            }

            // ✅ Verify and decode refresh token
            const metadata = await TokenJwtVerification(refreshToken, true);

            // ✅ Revoke token in database
            await this.organizationService.DeleteAccessToken(metadata.id, accessToken, refreshToken);

            loggerHandler.info(`[Auth] Logout successful for OrgID=${metadata.id}`);

            return ResponseSuccessBuilder(res, 200, "Logout success", null);
        } catch (error) {
            loggerHandler.error(`[Auth] Logout failed: ${error.message}`, {stack: error.stack});
            next(error);
        }
    };
}