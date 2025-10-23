import {TokenData} from "../types/data/auth";
import {TransformPermissionsAsync} from "./permissionHandler";
import {TokenJwtGenerator} from "../auth/token";
import {ConvertDateTime} from "./dateTime";
import {Organization} from "../types/data/organization";
import {OrganizationService} from "../../app/module/organization/organization.service";
import loggerHandler from "./loggerHandler";

/**
 * ✅ Generate Access & Refresh JWT tokens for an organization.
 *
 * @param organization - The organization entity with role and user data
 * @param organizationService - The organization service instance
 * @returns Object containing access_token, refresh_token, and metadata
 */
export const generateTokenJWT = async (
    organization: Organization,
    organizationService: OrganizationService
) => {
    try {
        if (!organization || !organization.role || !organization.organization_data) {
            throw new Error("Invalid organization data: role or organization_data missing");
        }

        // --- Load token expiration config safely
        const accessExp = parseInt(process.env.JWT_ACCESS_TOKEN_EXP || "3600", 10);
        const refreshExp = parseInt(process.env.JWT_REFRESH_TOKEN_EXP || "86400", 10);

        // --- Prepare token metadata
        const metadata: TokenData = {
            id: organization.id,
            authentik_userId: organization.authentik_userId,
            authentik_access_token: organization.authentik_access_token || organization.authentik_userId,
            email: organization.organization_data.email,
            name: organization.organization_data.name,
            role: organization.role.name,
            type: organization.role.access,
            permissions: (await TransformPermissionsAsync(organization.role.permissions)) || null,
            date: await ConvertDateTime(new Date()),
            expired: await ConvertDateTime(new Date(Date.now() + accessExp * 1000)),
        };

        // --- Generate JWTs
        const [accessToken, refreshToken] = await Promise.all([
            TokenJwtGenerator(metadata, String(accessExp), false),
            TokenJwtGenerator(metadata, String(refreshExp), true),
        ]);

        // --- Store refresh token securely in DB
        await organizationService.UpdateDataPatch(metadata.id, {access_token: refreshToken});
        loggerHandler.debug(`[JWT] ✅ Tokens generated and stored for organization: ${organization.id}`);

        // --- Return token response
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            data: {
                id: organization.id,
                ...metadata,
            },
            expired_in: accessExp,
        };
    } catch (error: any) {
        loggerHandler.error(`[JWT] ❌ Failed to generate token for organization: ${error.message}`);
        throw new Error(`Failed to generate JWT tokens: ${error.message}`);
    }
};