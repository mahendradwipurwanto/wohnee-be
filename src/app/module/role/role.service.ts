import {Repository} from "typeorm";
import {EntityRole} from "./role.model";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import loggerHandler from "../../../lib/helper/loggerHandler";

export class RoleService {
    constructor(
        private readonly roleRepository: Repository<EntityRole>
    ) {
    }

    /**
     * ✅ Get the default role
     * Returns the role marked as `is_default = true`
     */
    async getDefaultRole(): Promise<EntityRole> {
        try {
            const role = await this.roleRepository
                .createQueryBuilder("role")
                .select([
                    "role.id",
                    "role.name",
                    "role.permissions",
                    "role.access",
                    "role.is_default",
                    "role.parent_id",
                    "role.created_at",
                    "role.updated_at",
                ])
                .where("role.is_default = :is_default", {is_default: true})
                .andWhere("role.deleted_at IS NULL") // skip soft-deleted
                .limit(1)
                .getOne();

            if (!role) {
                loggerHandler.warn(`[ROLE] ⚠️ No default role found in database`);
                throw new CustomHttpExceptionError("Default role not found", 404);
            }

            loggerHandler.debug(`[ROLE] ✅ Default role loaded: ${role.name}`);
            return role;
        } catch (error: any) {
            loggerHandler.error(`[ROLE] ❌ Failed to fetch default role: ${error.message}`);
            throw new CustomHttpExceptionError("Error fetching default role", 500);
        }
    }

    /**
     * ✅ Get role by ID
     */
    async getRoleById(roleId: string): Promise<EntityRole> {
        if (!roleId) {
            throw new CustomHttpExceptionError("Role ID is required", 400);
        }

        try {
            const role = await this.roleRepository.findOne({
                where: {id: roleId},
                relations: ["parent", "children"],
            });

            if (!role) {
                throw new CustomHttpExceptionError("Role not found", 404);
            }

            loggerHandler.debug(`[ROLE] ✅ Role fetched: ${role.name} (${role.id})`);
            return role;
        } catch (error: any) {
            loggerHandler.error(`[ROLE] ❌ Failed to fetch role by ID: ${error.message}`);
            throw new CustomHttpExceptionError("Error fetching role by ID", 500);
        }
    }

    /**
     * ✅ Get all active roles
     */
    async getAllRoles(): Promise<EntityRole[]> {
        try {
            const roles = await this.roleRepository.find({
                where: {deleted_at: null},
                order: {created_at: "ASC"},
                select: [
                    "id",
                    "name",
                    "permissions",
                    "access",
                    "is_default",
                    "parent_id",
                    "created_at",
                    "updated_at",
                ],
            });

            loggerHandler.debug(`[ROLE] ✅ Loaded ${roles.length} roles`);
            return roles;
        } catch (error: any) {
            loggerHandler.error(`[ROLE] ❌ Failed to fetch roles: ${error.message}`);
            throw new CustomHttpExceptionError("Error fetching roles", 500);
        }
    }
}