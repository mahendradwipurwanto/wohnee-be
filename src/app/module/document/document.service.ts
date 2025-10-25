import { Repository } from "typeorm";
import MetaPagination from "../../../lib/helper/pagination";
import { EntityDocument } from "./document.model";
import { CreateDocumentRequest, UpdateDocumentRequest } from "./document.dto";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";
import { Document } from "../../../lib/types/data/document";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");
const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

export class DocumentService {
    constructor(private readonly documentRepository: Repository<EntityDocument>) {}

    /** ✅ Get paginated list with filters and sort */
    async getAllData(
        page: number,
        limit: number,
        sortBy: string,
        order: "ASC" | "DESC",
        filterBy: string,
        filterValue: string,
        filterOperator: string
    ) {
        const queryBuilder = this.documentRepository.createQueryBuilder("document");

        queryBuilder
            .select([
                "document.id",
                "document.unit_id",
                "document.title",
                "document.description",
                "document.type",
                "document.analyze_state",
                "document.file_path",
                "document.created_at",
                "document.updated_at",
                "document.deleted_at",
                "unit.id",
                "unit.name",
            ])
            .leftJoin("document.unit", "unit")
            .where("document.deleted_at IS NULL");

        const filterFieldMap: Record<string, string> = {
            title: "document.title",
            type: "document.type",
            analyze_state: "document.analyze_state",
            created_at: "document.created_at",
        };

        const defaultOperatorMap: Record<string, string> = {
            title: "LIKE",
            type: "LIKE",
            analyze_state: "EQUALS",
            created_at: "BETWEEN",
        };

        const dbField = filterFieldMap[filterBy];

        if (dbField && filterValue) {
            const operator = (filterOperator || defaultOperatorMap[filterBy] || "LIKE").toUpperCase();

            switch (operator) {
                case "EQUALS":
                    queryBuilder.andWhere(`${dbField} = :value`, { value: filterValue });
                    break;
                case "NOT_EQUALS":
                    queryBuilder.andWhere(`${dbField} != :value`, { value: filterValue });
                    break;
                case "BETWEEN":
                    const [startRaw, endRaw] = filterValue.split(",").map(v => v.trim());
                    if (startRaw && endRaw) {
                        const start = dayjs(startRaw).startOf("day").format("YYYY-MM-DD HH:mm:ss");
                        const end = dayjs(endRaw).endOf("day").format("YYYY-MM-DD HH:mm:ss");
                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, { start, end });
                    }
                    break;
                default:
                    queryBuilder.andWhere(`LOWER(${dbField}) LIKE LOWER(:value)`, {
                        value: `%${filterValue.toLowerCase()}%`,
                    });
            }
        }

        if (sortBy && filterFieldMap[sortBy]) {
            queryBuilder.addOrderBy(filterFieldMap[sortBy], order);
        }

        const [documentList, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedList = documentList.map((doc) => ({
            ...doc,
            created_at: dayjs(doc.created_at).tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        }));

        return {
            list: formattedList,
            meta: MetaPagination(page, limit, total),
        };
    }

    /** ✅ Get document detail by ID */
    async getDetailData(id: string): Promise<EntityDocument | null> {
        return this.documentRepository
            .createQueryBuilder("document")
            .leftJoinAndSelect("document.unit", "unit")
            .where("document.deleted_at IS NULL")
            .andWhere("document.id = :id", { id })
            .getOne();
    }

    /** ✅ Create document */
    async createData(payload: CreateDocumentRequest): Promise<Document | null> {
        const newDoc = this.documentRepository.create({
            unit_id: payload.unit_id,
            title: payload.title,
            description: payload.description,
            type: payload.type,
            analyze_state: payload.analyze_state ?? 0,
            file_path: payload.file_path,
        });

        const saved = await this.documentRepository.save(newDoc);
        return this.getDetailData(saved.id);
    }

    /** ✅ Update document */
    async updateData(id: string, payload: UpdateDocumentRequest): Promise<Document | null> {
        const doc = await this.documentRepository.findOne({ where: { id } });
        if (!doc) return null;

        Object.assign(doc, payload);
        await this.documentRepository.save(doc);

        return this.getDetailData(id);
    }

    /** ✅ Soft delete document */
    async deleteData(id: string): Promise<void> {
        const doc = await this.documentRepository.findOne({ where: { id } });
        if (!doc) return;

        doc.deleted_at = new Date();
        await this.documentRepository.save(doc);
    }
}