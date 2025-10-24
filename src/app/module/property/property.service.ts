import {getMetadataArgsStorage, Repository} from "typeorm";
import MetaPagination from "../../../lib/helper/pagination";
import {EntityProperty} from "./property.model";
import {CreatePropertyRequest, UpdatePropertyRequest} from "./property.dto";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";
import {EntityOrganizationData} from "../organization/organization-data.model";
import {EntityOrganization} from "../organization/organization.model";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {Property} from "../../../lib/types/data/property";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

export class PropertyService {
    constructor(private readonly propertyRepository: Repository<EntityProperty>) {
    }

    /**
     * Get paginated property list with filter & sort
     */
    async getAllData(
        page: number,
        limit: number,
        sortBy: string,
        order: "ASC" | "DESC",
        filterBy: string,
        filterValue: string,
        filterOperator: string
    ) {
        const queryBuilder = this.propertyRepository.createQueryBuilder("property");

        queryBuilder
            .select([
                "property.id",
                "property.org_id",
                "property.name",
                "property.country_id",
                "country.id",
                "country.name",
                "country.code",
                "country.dial_code",
                "property.city",
                "property.street",
                "property.housenumber",
                "property.zip_code",
                "property.created_at",
                "property.updated_at",
                "property.deleted_at",
            ])
            .leftJoin("property.country", "country")
            .where("property.deleted_at IS NULL");

        // 🔍 Filter mapping
        const filterFieldMap: Record<string, string> = {
            name: "property.name",
            city: "property.city",
            country_id: "property.country_id",
            org_id: "property.org_id",
            created_at: "property.created_at",
            updated_at: "property.updated_at",
        };

        const defaultOperatorMap: Record<string, string> = {
            name: "LIKE",
            city: "LIKE",
            country_id: "EQUALS",
            org_id: "EQUALS",
            created_at: "BETWEEN",
            updated_at: "BETWEEN",
        };

        const dbField = filterFieldMap[filterBy];

        if (dbField && filterValue) {
            const operator = (filterOperator || defaultOperatorMap[filterBy] || "LIKE").toUpperCase();

            switch (operator) {
                case "EQUALS":
                case "=":
                    queryBuilder.andWhere(`${dbField} = :value`, {value: filterValue});
                    break;
                case "NOT_EQUALS":
                case "!=":
                    queryBuilder.andWhere(`${dbField} != :value`, {value: filterValue});
                    break;
                case "GREATER":
                case ">=":
                    queryBuilder.andWhere(`${dbField} >= :value`, {value: filterValue});
                    break;
                case "LESS":
                case "<=":
                    queryBuilder.andWhere(`${dbField} <= :value`, {value: filterValue});
                    break;
                case "BETWEEN":
                    const [startRaw, endRaw] = filterValue.split(",").map((v) => v.trim());
                    if (startRaw && endRaw) {
                        const start = dayjs(startRaw).startOf("day").format("YYYY-MM-DD HH:mm:ss");
                        const end = dayjs(endRaw).endOf("day").format("YYYY-MM-DD HH:mm:ss");
                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, {start, end});
                    } else if (startRaw) {
                        const start = dayjs(startRaw).startOf("day").format("YYYY-MM-DD HH:mm:ss");
                        const end = dayjs(startRaw).endOf("day").format("YYYY-MM-DD HH:mm:ss");
                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, {start, end});
                    }
                    break;
                case "LIKE":
                default:
                    queryBuilder.andWhere(`LOWER(${dbField}) LIKE LOWER(:value)`, {
                        value: `%${filterValue.toLowerCase()}%`,
                    });
                    break;
            }
        }

        // Sorting
        if (sortBy && filterFieldMap[sortBy]) {
            queryBuilder.addOrderBy(filterFieldMap[sortBy], order);
        }

        const [propertyList, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedList = propertyList.map((prop) => ({
            ...prop,
            created_at: dayjs(prop.created_at).tz(TIMEZONE).format("YYYY-MM-DD"),
        }));

        return {
            list: formattedList,
            meta: MetaPagination(page, limit, total),
        };
    }

    /**
     * Get detail property
     */
    async getDetailData(id: string): Promise<EntityProperty | null> {
        const property = await this.propertyRepository
            .createQueryBuilder("property")
            .leftJoinAndSelect("property.country", "country") // ✅ load country details automatically
            .where("property.deleted_at IS NULL")
            .andWhere("property.id = :id", { id })
            .getOne();

        if (!property) return null;

        return property;
    }

    async createData(org_id: string, payload: CreatePropertyRequest): Promise<Property | null> {
        const mainData: Record<string, any> = {};

        // START SETUP DATA

        // Define the related entities
        const relatedEntities: Record<string, any> = {};

        // Define the payload data
        const input = {
            org_id: org_id,
            name: payload.name,
            country_id: payload.country_id,
            city: payload.city,
            street: payload.street,
            house_number: payload.housenumber,
            zip_code: payload.zip_code
        }

        // Mapping the input data by table
        const entityFieldMap = {
            organization: ['org_id', 'name', 'country_id', 'city', 'street', 'house_number', 'zip_code'],
        }

        const foreignKeyMap = {}

        // END SETUP DATA

        // START DYNAMIC PROCESS

        for (const field of entityFieldMap.organization) {
            if (input[field] !== undefined) {
                mainData[field] = input[field];
            }
        }

        // Create and save main entity first
        const savedMain = await this.propertyRepository.save(this.propertyRepository.create(mainData));

        // Prepare and insert related entities if needed
        for (const relationKey in relatedEntities) {
            const repo = this.propertyRepository.manager.getRepository(relatedEntities[relationKey]);
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

        return await this.getDetailData(savedMain.id);
    }

    async updateData(id: string, payload: UpdatePropertyRequest): Promise<Property | null> {
        // START SETUP DATA

        // Get the main table data
        const mainRecord = await this.propertyRepository.findOne({where: {id}});

        // Define the related entities
        const relatedEntities: Record<string, any> = {};

        // Define the payload data
        const input = {
            name: payload.name,
            country_id: payload.country_id,
            city: payload.city,
            street: payload.street,
            house_number: payload.housenumber,
            zip_code: payload.zip_code
        }

        // Mapping the input data by table
        const entityFieldMap = {
            organization: ['org_id', 'name', 'country_id', 'city', 'street', 'house_number', 'zip_code'],
        }

        const foreignKeyMap = {}

        // END SETUP DATA

        // START DYNAMIC PROCESS

        // Update main entity only if field exists in payload
        for (const field of entityFieldMap.organization) {
            if (input[field] !== undefined) {
                (mainRecord as any)[field] = input[field];
            }
        }

        await this.propertyRepository.save(mainRecord);

        // Update related entities
        for (const relationKey in relatedEntities) {
            const repo = this.propertyRepository.manager.getRepository(relatedEntities[relationKey]);
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

        return await this.getDetailData(id);
    }

    async UpdateDataPatch(id: string, data: Record<string, any>) {
        const queryRunner = this.propertyRepository.manager.connection.createQueryRunner();

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
            return await this.getDetailData(id);

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
        const mainRecord = await this.propertyRepository.findOne({where: {id}});

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
                const repo = this.propertyRepository.manager.getRepository(entity);

                const relatedRecords = await repo.find({where: {[foreignKey]: id}});

                if (relatedRecords.length > 0) {
                    throw new Error(`Cannot delete user data cause still in user at: ${entity.name}`);
                }
            }
        }

        if (options?.cascade) {
            for (const key in relationDeleteMap) {
                const {entity, foreignKey} = relationDeleteMap[key];
                const repo = this.propertyRepository.manager.getRepository(entity);

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
            await this.propertyRepository.save(mainRecord);
        } else {
            await this.propertyRepository.remove(mainRecord);
        }

        // END DYNAMIC PROCESS

        return;
    }
}