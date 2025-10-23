import {Repository} from "typeorm";
import MetaPagination from "../../../lib/helper/pagination";
import {EntityFaq} from "./property.model";
import {ConvertDateTime, formatDateOrNull} from "../../../lib/helper/common";
import {Faq} from "../../../lib/types/data/property";
import {CreateFaqRequest, UpdateFaqRequest} from "./property.dto";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";

dayjs.extend(utc);
dayjs.extend(timezone);

// Set the locale to Indonesian
dayjs.locale('id');
// Assuming you want to convert to a specific timezone (e.g., 'Asia/Jakarta')
const TIMEZONE =  process.env.TIMEZONE || "Asia/Jakarta";

export class PropertyService {
    constructor(
        private readonly faqRepository: Repository<EntityFaq>,
    ) {
    }

    async getAllData(
        page: number,
        limit: number,
        sortBy: string,
        order: "ASC" | "DESC",
        filterBy: string,
        filterValue: string,
        filterOperator: string
    ) {
        const queryBuilder = this.faqRepository.createQueryBuilder('faq');

        queryBuilder
            .select([
                'property.id',
                'property.property',
                'property.answer',
                'faq_category.category',
                'faq_category.icon',
                'property.created_at',
                'property.updated_at',
                'property.deleted_at',
            ])
            .leftJoin('property.faq_category', 'faq_category')
            .where('property.deleted_at IS NULL');

        // Filter field map - add blockchain filter if needed
        const filterFieldMap: Record<string, string> = {
            faq: 'property.property',
            answer: 'property.answer',
            category: 'faq_category.category',
            created_at: 'property.created_at',
            updated_at: 'property.updated_at',
        };

        // Default operator map - add blockchain operator if needed
        const defaultOperatorMap: Record<string, string> = {
            faq: 'LIKE',
            answer: 'LIKE',
            category: 'LIKE',
            created_at: 'BETWEEN',
            updated_at: 'BETWEEN',
        };

        const dbField = filterFieldMap[filterBy];

        if (dbField && filterValue) {
            const operator = (filterOperator || defaultOperatorMap[filterBy] || 'LIKE').toUpperCase();

            switch (operator) {
                case 'EQUALS':
                case '=':
                    queryBuilder.andWhere(`${dbField} = :value`, {value: filterValue});
                    break;

                case 'NOT_EQUALS':
                case '!=':
                    queryBuilder.andWhere(`${dbField} != :value`, {value: filterValue});
                    break;

                case 'GREATER':
                case '>=':
                    queryBuilder.andWhere(`${dbField} >= :value`, {value: filterValue});
                    break;

                case 'LESS':
                case '=<':
                    queryBuilder.andWhere(`${dbField} <= :value`, {value: filterValue});
                    break;

                case 'BETWEEN':
                    const [startRaw, endRaw] = filterValue.split(',').map(v => v.trim());

                    if (startRaw && endRaw) {
                        const start = dayjs(startRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).startOf('day').format('YYYY-MM-DD HH:mm:ss');
                        const end = dayjs(endRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).endOf('day').format('YYYY-MM-DD HH:mm:ss');

                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, {
                            start,
                            end,
                        });
                    } else if (startRaw) {
                        // If only one date is provided, treat it as a full-day range
                        const start = dayjs(startRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).startOf('day').format('YYYY-MM-DD HH:mm:ss');
                        const end = dayjs(startRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).endOf('day').format('YYYY-MM-DD HH:mm:ss');

                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, {
                            start,
                            end,
                        });
                    }
                    break;

                case 'LIKE':
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

        const [faq, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedFaq = await Promise.all(faq.map(async (faq) => ({
            ...faq,
            category: faq.faq_category ? faq.faq_category.category : null,
            created_at: dayjs(faq.created_at).tz(TIMEZONE).locale('id').format('YYYY-MM-DD'),
            updated_at: formatDateOrNull(faq.updated_at, TIMEZONE) == null ? dayjs(faq.created_at).tz(TIMEZONE).locale('id').format('YYYY-MM-DD') : formatDateOrNull(faq.updated_at, TIMEZONE),
        })));

        return {
            list: formattedFaq,
            meta: MetaPagination(page, limit, total),
        };
    }

    //detail
    async getDetailData(id: string): Promise<Faq | null> {
        const queryBuilder = this.faqRepository.createQueryBuilder('faq');
        queryBuilder
            .select([
                'property.id',
                'property.property',
                'property.answer',
                'faq_category.category',
                'faq_category.icon',
                'property.created_at',
                'property.updated_at',
                'property.deleted_at',
            ])
            .leftJoin('property.faq_category', 'faq_category')
            .where('property.deleted_at IS NULL')
            .andWhere('property.id = :id', {id: id});

        const faq = await queryBuilder.getOne();

        if (!faq) return null;

        return {
            ...faq,
            category: faq.faq_category ? faq.faq_category.category : null,
            created_at: await ConvertDateTime(faq.created_at),
            updated_at: formatDateOrNull(faq.updated_at, TIMEZONE) == null ? dayjs(faq.created_at).tz(TIMEZONE).locale('id').format('YYYY-MM-DD') : formatDateOrNull(faq.updated_at, TIMEZONE),
        };
    }

    async createData(payload: CreateFaqRequest): Promise<Faq | null> {
        const mainData: Record<string, any> = {};

        // START SETUP DATA

        // Define the related entities
        const relatedEntities: Record<string, any> = {};

        // Define the payload data
        const input = {
            faq: payload.faq,
            answer: payload.answer,
            faq_category_id: payload.faq_category_id
        }

        // Mapping the input data by table
        const entityFieldMap = {
            faq: ['faq', 'answer', 'faq_category_id'],
        }

        const foreignKeyMap = {}

        // END SETUP DATA

        // START DYNAMIC PROCESS
        for (const field of entityFieldMap.faq) {
            if (input[field] !== undefined) {
                mainData[field] = input[field];
            }
        }

        // Create and save main entity first
        const savedMain = await this.faqRepository.save(this.faqRepository.create(mainData));

        // Prepare and insert related entities if needed
        for (const relationKey in relatedEntities) {
            const repo = this.faqRepository.manager.getRepository(relatedEntities[relationKey]);
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

    async updateData(id: string, payload: UpdateFaqRequest): Promise<Faq | null> {
        // START SETUP DATA

        // Get the main table data
        const mainRecord = await this.faqRepository.findOne({where: {id}});

        // Define the related entities
        const relatedEntities: Record<string, any> = {};

        // Define the payload data
        const input = {
            faq: payload.faq,
            answer: payload.answer,
            faq_category_id: payload.faq_category_id
        }

        // Mapping the input data by table
        const entityFieldMap = {
            faq: ['faq', 'answer', 'faq_category_id'],
        }

        const foreignKeyMap = {}

        // END SETUP DATA

        // START DYNAMIC PROCESS

        // Update main entity only if field exists in payload
        for (const field of entityFieldMap.faq) {
            if (input[field] !== undefined) {
                (mainRecord as any)[field] = input[field];
            }
        }

        await this.faqRepository.save(mainRecord);

        // Update related entities
        for (const relationKey in relatedEntities) {
            const repo = this.faqRepository.manager.getRepository(relatedEntities[relationKey]);
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

    async deleteData(id: string) {
        // START SETUP DATA

        // Get the main table data
        const mainRecord = await this.faqRepository.findOne({where: {id}});

        const options = {
            softDelete: true,
            preventDeleteIfUsed: false,
            cascade: true
        }

        const relationDeleteMap = {}

        // END SETUP DATA

        // START DYNAMIC PROCESS

        if (options?.preventDeleteIfUsed) {
            for (const key in relationDeleteMap) {
                const {entity, foreignKey} = relationDeleteMap[key];
                const repo = this.faqRepository.manager.getRepository(entity);

                const relatedRecords = await repo.find({where: {[foreignKey]: id}});

                if (relatedRecords.length > 0) {
                    throw new Error(`Cannot delete data cause still in at: ${entity.name}`);
                }
            }
        }

        if (options?.cascade) {
            for (const key in relationDeleteMap) {
                const {entity, foreignKey} = relationDeleteMap[key];
                const repo = this.faqRepository.manager.getRepository(entity);

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
            await this.faqRepository.save(mainRecord);
        } else {
            await this.faqRepository.remove(mainRecord);
        }

        // END DYNAMIC PROCESS

        return;
    }

    async getFaqCategory() {
        const queryBuilder = this.faqRepository.manager.createQueryBuilder('faq_category', 'faq_category');

        queryBuilder
            .select(['faq_category.id', 'faq_category.category', 'faq_category.icon'])
            .where('faq_category.deleted_at IS NULL');

        const faqCategories = await queryBuilder.getMany();

        return faqCategories.map(category => ({
            id: category.id,
            category: category.category,
            icon: category.icon,
        }));
    }

    async getFaqCategoryDetail(id: string) {
        const queryBuilder = this.faqRepository.manager.createQueryBuilder('faq_category', 'faq_category');

        queryBuilder
            .select(['faq_category.id', 'faq_category.category', 'faq_category.icon'])
            .where('faq_category.deleted_at IS NULL')
            .andWhere('faq_category.id = :id', {id: id});

        const faqCategory = await queryBuilder.getOne();

        if (!faqCategory) return null;

        return {
            id: faqCategory.id,
            category: faqCategory.category,
            icon: faqCategory.icon,
        };
    }

    async getAll(
        page: number,
        limit: number,
        sortBy: string,
        order: "ASC" | "DESC",
        filterBy: string,
        filterValue: string,
        filterOperator: string
    ) {
        const queryBuilder = this.faqRepository.createQueryBuilder('faq');

        queryBuilder
            .select([
                'property.id',
                'property.property',
                'property.answer',
                'faq_category.category',
                'faq_category.icon',
                'property.created_at',
                'property.updated_at',
                'property.deleted_at',
            ])
            .leftJoin('property.faq_category', 'faq_category')
            .where('property.deleted_at IS NULL');

        // Filter field map - add blockchain filter if needed
        const filterFieldMap: Record<string, string> = {
            faq: 'property.property',
            answer: 'property.answer',
            category: 'faq_category.category',
            created_at: 'property.created_at',
            updated_at: 'property.updated_at',
        };

        // Default operator map - add blockchain operator if needed
        const defaultOperatorMap: Record<string, string> = {
            faq: 'LIKE',
            answer: 'LIKE',
            category: 'LIKE',
            created_at: 'BETWEEN',
            updated_at: 'BETWEEN',
        };

        const dbField = filterFieldMap[filterBy];

        if (dbField && filterValue) {
            const operator = (filterOperator || defaultOperatorMap[filterBy] || 'LIKE').toUpperCase();

            switch (operator) {
                case 'EQUALS':
                case '=':
                    queryBuilder.andWhere(`${dbField} = :value`, {value: filterValue});
                    break;

                case 'NOT_EQUALS':
                case '!=':
                    queryBuilder.andWhere(`${dbField} != :value`, {value: filterValue});
                    break;

                case 'GREATER':
                case '>=':
                    queryBuilder.andWhere(`${dbField} >= :value`, {value: filterValue});
                    break;

                case 'LESS':
                case '=<':
                    queryBuilder.andWhere(`${dbField} <= :value`, {value: filterValue});
                    break;

                case 'BETWEEN':
                    const [startRaw, endRaw] = filterValue.split(',').map(v => v.trim());

                    if (startRaw && endRaw) {
                        const start = dayjs(startRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).startOf('day').format('YYYY-MM-DD HH:mm:ss');
                        const end = dayjs(endRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).endOf('day').format('YYYY-MM-DD HH:mm:ss');

                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, {
                            start,
                            end,
                        });
                    } else if (startRaw) {
                        // If only one date is provided, treat it as a full-day range
                        const start = dayjs(startRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).startOf('day').format('YYYY-MM-DD HH:mm:ss');
                        const end = dayjs(startRaw, ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD']).endOf('day').format('YYYY-MM-DD HH:mm:ss');

                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, {
                            start,
                            end,
                        });
                    }
                    break;

                case 'LIKE':
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

        const [faq, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedFaq = await Promise.all(faq.map(async (faq) => ({
            ...faq,
            category: faq.faq_category ? faq.faq_category.category : null,
            created_at: dayjs(faq.created_at).tz(TIMEZONE).locale('id').format('YYYY-MM-DD'),
            updated_at: formatDateOrNull(faq.updated_at, TIMEZONE) == null ? dayjs(faq.created_at).tz(TIMEZONE).locale('id').format('YYYY-MM-DD') : formatDateOrNull(faq.updated_at, TIMEZONE),
        })));

        //remove faq_category from formattedFaq
        formattedFaq.forEach(faq => {
            delete faq.faq_category;
        });

        return {
            list: formattedFaq.length > 0 ? formattedFaq : null,
            category: await this.getFaqCategory(),
            meta: MetaPagination(page, limit, total),
        };
    }
}