import {getMetadataArgsStorage, Repository} from "typeorm";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";

import {checkPicturePath} from "../../../lib/helper/common";

import {CreateOrganizationRequest, UpdateOrganizationRequest} from "./organization.dto";
import {Organization} from "../../../lib/types/data/organization";
import {EntityOrganization} from "./organization.model";
import {EntityOrganizationData} from "./organization-data.model";
import {RoleService} from "../role/role.service";
import ConvertPermissionsFromDatabase from "../../../lib/helper/permissionHandler";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";

dayjs.extend(utc);
dayjs.extend(timezone);

// Set the locale to Indonesian
dayjs.locale('id');

export class OrganizationService {
    constructor(
        private readonly organizationRepository: Repository<EntityOrganization>,
        private readonly roleService: RoleService,
    ) {
    }

    async createData(payload: CreateOrganizationRequest): Promise<Organization | null> {
        const mainData: Record<string, any> = {};

        // START SETUP DATA

        // Define the related entities
        const relatedEntities: Record<string, any> = {
            organization_data: EntityOrganizationData
        };

        const role = await this.roleService.getDefaultRole();

        // Define the payload data
        const input = {
            authentik_access_token: payload.authentik_accessToken,
            authentik_userId: payload.authentik_userId,
            email: payload.authentik_userEmail,
            name: payload.authentik_name,

            //default
            status: 1, //default active
            profile: payload.authentik_profileImagePath || "https://ui-avatars.com/api/?background=random",
            role_id: role.id,
        }

        // Mapping the input data by table
        const entityFieldMap = {
            organization: ['authentik_access_token', 'authentik_userId', 'role_id', 'status'],
            organization_data: ['email', 'name', 'profile']
        }

        const foreignKeyMap = {
            organization_data: 'org_id'
        }

        // END SETUP DATA

        // START DYNAMIC PROCESS

        for (const field of entityFieldMap.organization) {
            if (input[field] !== undefined) {
                mainData[field] = input[field];
            }
        }

        // Create and save main entity first
        const savedMain = await this.organizationRepository.save(this.organizationRepository.create(mainData));

        // Prepare and insert related entities if needed
        for (const relationKey in relatedEntities) {
            const repo = this.organizationRepository.manager.getRepository(relatedEntities[relationKey]);
            const relationFields = entityFieldMap[relationKey];
            const relationData: Record<string, any> = {};

            for (const field of relationFields) {
                // Support both nested and flat input
                if (input[relationKey]?.[field] !== undefined) {
                    relationData[field] = input[relationKey][field];
                } else if (input[field] !== undefined) {
                    relationData[field] = input[field];
                }
            }

            // 🔁 Check if we need to backfill a foreign key from main entity
            if (foreignKeyMap && foreignKeyMap[relationKey]) {
                const foreignKey = foreignKeyMap[relationKey];
                if (!relationData[foreignKey]) {
                    relationData[foreignKey] = (savedMain as any).id;
                }
            }

            if (Object.keys(relationData).length > 0) {
                const relatedEntity = repo.create(relationData);
                await repo.save(relatedEntity);
            }
        }

        // END DYNAMIC PROCESS

        return await this.GetOrgByParams({authentik_userId: payload.authentik_userId});
    }

    async updateData(id: string, payload: UpdateOrganizationRequest): Promise<Organization | null> {
        // START SETUP DATA

        // Get the main table data
        const mainRecord = await this.organizationRepository.findOne({where: {id}});

        // Define the related entities
        const relatedEntities: Record<string, any> = {
            organization_data: EntityOrganizationData
        };

        // Define the payload data

        const input = {
            status: 1, //default active

            //organization data
            name: payload.name,
            email: payload.email,
            profile: payload.profile || "https://ui-avatars.com/api/?background=random",
            phone: payload.phone
        }

        // Mapping the input data by table
        const entityFieldMap = {
            organization: ['status'],
            organization_data: ['email', 'name', 'profile', 'phone']
        }

        const foreignKeyMap = {
            organization_data: 'org_id'
        }

        // END SETUP DATA

        // START DYNAMIC PROCESS

        // Update main entity only if field exists in payload
        for (const field of entityFieldMap.organization) {
            if (input[field] !== undefined) {
                (mainRecord as any)[field] = input[field];
            }
        }

        await this.organizationRepository.save(mainRecord);

        // Update related entities
        for (const relationKey in relatedEntities) {
            const repo = this.organizationRepository.manager.getRepository(relatedEntities[relationKey]);
            const relationFields = entityFieldMap[relationKey];
            const relationInput = input[relationKey] || input; // support nested or flat

            const relationWhere: any = {};
            if (foreignKeyMap && foreignKeyMap[relationKey]) {
                const foreignKey = foreignKeyMap[relationKey];
                relationWhere[foreignKey] = id;
            }

            let relatedRecord = await repo.findOne({where: relationWhere});

            if (relationFields.some(field => relationInput[field] !== undefined)) {
                // If record doesn't exist and payload contains relevant fields, create it
                if (!relatedRecord) {
                    relatedRecord = repo.create();
                    if (foreignKeyMap && foreignKeyMap[relationKey]) {
                        const foreignKey = foreignKeyMap[relationKey];
                        relatedRecord[foreignKey] = id;
                    }
                }

                // Apply updates
                for (const field of relationFields) {
                    if (relationInput[field] !== undefined) {
                        relatedRecord[field] = relationInput[field];
                    }
                }

                await repo.save(relatedRecord);
            }
        }

        // END DYNAMIC PROCESS

        return await this.GetOrgByParams({id: id});
    }

    async UpdateDataPatch(id: string, data: Record<string, any>) {
        const queryRunner = this.organizationRepository.manager.connection.createQueryRunner();

        try {
            // ✅ Ensure connection is established
            await queryRunner.connect();

            // ✅ Start transaction
            await queryRunner.startTransaction();

            // --- Fetch organization with related data
            const organization = await queryRunner.manager.findOne(EntityOrganization, {
                where: {id},
                relations: ["organization_data"],
            });

            if (!organization) {
                throw new CustomHttpExceptionError(`Organization not found with id ${id}`, 404);
            }

            // --- Extract dynamic columns
            const orgColumns = getMetadataArgsStorage()
                .columns.filter((col) => col.target === EntityOrganization)
                .map((col) => col.propertyName);

            const orgDataColumns = getMetadataArgsStorage()
                .columns.filter((col) => col.target === EntityOrganizationData)
                .map((col) => col.propertyName);

            // --- Separate updates
            const orgUpdates = Object.fromEntries(
                Object.entries(data).filter(([key]) => orgColumns.includes(key))
            );

            const orgDataUpdates = Object.fromEntries(
                Object.entries(data).filter(([key]) => orgDataColumns.includes(key))
            );

            // --- Update organization fields
            Object.assign(organization, orgUpdates);

            // --- Update organization_data fields
            if (Object.keys(orgDataUpdates).length > 0) {
                let organizationData = organization.organization_data;

                if (!organizationData) {
                    organizationData = new EntityOrganizationData();
                    organizationData.org_id = organization.id;
                }

                Object.assign(organizationData, orgDataUpdates);
                await queryRunner.manager.save(EntityOrganizationData, organizationData);
            }

            await queryRunner.manager.save(EntityOrganization, organization);

            // ✅ Commit only if transaction active
            if (queryRunner.isTransactionActive) {
                await queryRunner.commitTransaction();
            }

            // ✅ Return updated org
            return await this.GetOrgByParams({id: organization.id});

        } catch (error) {
            // ✅ Rollback only if transaction started
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }

            throw error;

        } finally {
            // ✅ Always release connection
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }

    async deleteData(id: string) {
        // START SETUP DATA

        // Get the main table data
        const mainRecord = await this.organizationRepository.findOne({where: {id}});

        const options = {
            softDelete: true,
            preventDeleteIfUsed: false,
            cascade: true
        }

        const relationDeleteMap = {
            user_data: {
                entity: EntityOrganizationData,
                foreignKey: 'org_id'
            }
        }

        // END SETUP DATA

        // START DYNAMIC PROCESS

        if (options?.preventDeleteIfUsed) {
            for (const key in relationDeleteMap) {
                const {entity, foreignKey} = relationDeleteMap[key];
                const repo = this.organizationRepository.manager.getRepository(entity);

                const relatedRecords = await repo.find({where: {[foreignKey]: id}});

                if (relatedRecords.length > 0) {
                    throw new Error(`Cannot delete user data cause still in user at: ${entity.name}`);
                }
            }
        }

        if (options?.cascade) {
            for (const key in relationDeleteMap) {
                const {entity, foreignKey} = relationDeleteMap[key];
                const repo = this.organizationRepository.manager.getRepository(entity);

                const relatedRecords = await repo.find({
                    where: {[foreignKey]: id}
                });

                if (relatedRecords.length > 0) {
                    if (options?.softDelete) {
                        for (const record of relatedRecords) {
                            record['deleted_at'] = new Date();
                            await repo.save(record);
                        }
                    } else {
                        await repo.remove(relatedRecords);
                    }
                }
            }
        }

        if (options?.softDelete) {
            (mainRecord as any).deleted_at = new Date();
            await this.organizationRepository.save(mainRecord);
        } else {
            await this.organizationRepository.remove(mainRecord);
        }

        // END DYNAMIC PROCESS

        return;
    }

    /**
     * ✅ Restore a soft-deleted organization by ID
     * Resets deleted_at and optionally updates status.
     */
    async restoreData(id: string): Promise<Organization | null> {
        const orgRepo = this.organizationRepository;

        // 1️⃣ Fetch organization, including soft-deleted
        const organization = await orgRepo.findOne({where: {id}, withDeleted: true});

        if (!organization) {
            throw new CustomHttpExceptionError(`Organization not found with ID ${id}`, 404);
        }

        // 2️⃣ Check if it’s actually deleted
        if (!organization.deleted_at) {
            throw new CustomHttpExceptionError(`Organization with ID ${id} is already active`, 400);
        }

        // 3️⃣ Restore organization (clears deleted_at)
        await this.organizationRepository
            .createQueryBuilder()
            .update(EntityOrganization)
            .set({deleted_at: null})
            .where("id = :id", {id})
            .execute();

        // 5️⃣ Return fresh instance (non-deleted)
        return await this.GetOrgByParams({id});
    }

    async GetOrgByParams(
        params: { [key: string]: any },
        matchType: "AND" | "OR" = "AND",
        includeDeleted = false // 🆕 Default false for safety
    ): Promise<Organization | null> {
        const queryBuilder = this.organizationRepository.createQueryBuilder("organization");

        const whereConditions: string[] = [];
        const parameters: Record<string, any> = {};

        const buildWhereConditions = (obj: Record<string, any>, prefix = "") => {
            for (const [key, value] of Object.entries(obj)) {
                const field = prefix
                    ? `${prefix}.${key}`
                    : key.includes(".") ||
                    key.startsWith("organization") ||
                    key.startsWith("role") ||
                    key.startsWith("organization_data")
                        ? key
                        : `organization.${key}`;

                const paramKey = field.replace(/\./g, "_");

                if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                    buildWhereConditions(value, field);
                } else if (Array.isArray(value)) {
                    whereConditions.push(`${field} IN (:...${paramKey})`);
                    parameters[paramKey] = value;
                } else {
                    whereConditions.push(`${field} = :${paramKey}`);
                    parameters[paramKey] = value;
                }
            }
        };

        buildWhereConditions(params);
        const whereClause = whereConditions.join(` ${matchType} `);

        queryBuilder
            .leftJoinAndSelect("organization.role", "role")
            .leftJoinAndSelect("organization.organization_data", "organization_data")
            .where(whereClause, parameters);

        // ✅ includeDeleted
        if (includeDeleted) {
            queryBuilder.withDeleted();
        } else {
            queryBuilder.andWhere("organization.deleted_at IS NULL");
        }

        const organization = await queryBuilder.getOne();
        if (!organization) return null;

        return {
            ...organization,
            organization_data: {
                ...organization.organization_data,
                profile: checkPicturePath(organization.organization_data?.profile),
            },
            role: {
                ...organization.role,
                permissions: ConvertPermissionsFromDatabase(organization.role?.permissions),
                created_at: new Date(organization.created_at),
                updated_at: new Date(organization.updated_at),
            },
            created_at: new Date(organization.created_at),
            updated_at: new Date(organization.updated_at),
        };
    }

    async DeleteAccessToken(id: string, access_token: string, refresh_token: string) {
        return this.organizationRepository.delete({
            id,
            authentik_access_token: access_token,
            refresh_token: refresh_token
        });
    }
}