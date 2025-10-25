import {Repository} from "typeorm";
import MetaPagination from "../../../lib/helper/pagination";
import {EntityUnit} from "./unit.model";
import {CreateUnitRequest, UpdateUnitRequest} from "./unit.dto";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";
import {Unit} from "../../../lib/types/data/unit";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

export class UnitService {
    constructor(private readonly unitRepository: Repository<EntityUnit>) {
    }

    /**
     * 📄 Get paginated list of units with filter & sort
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
        const queryBuilder = this.unitRepository.createQueryBuilder("unit");

        queryBuilder
            .select([
                "unit.id",
                "unit.property_id",
                "unit.name",
                "unit.floor",
                "unit.living_area",
                "unit.created_at",
                "unit.updated_at",
                "unit.deleted_at",
            ])
            .where("unit.deleted_at IS NULL");

        // 🔍 Filter mapping
        const filterFieldMap: Record<string, string> = {
            name: "unit.name",
            property_id: "unit.property_id",
            floor: "unit.floor",
            living_area: "unit.living_area",
            created_at: "unit.created_at",
            updated_at: "unit.updated_at",
        };

        const defaultOperatorMap: Record<string, string> = {
            name: "LIKE",
            property_id: "EQUALS",
            floor: "EQUALS",
            living_area: "EQUALS",
            created_at: "BETWEEN",
            updated_at: "BETWEEN",
        };

        const dbField = filterFieldMap[filterBy];

        if (dbField && filterValue) {
            const operator = (filterOperator || defaultOperatorMap[filterBy] || "LIKE").toUpperCase();

            switch (operator) {
                case "EQUALS":
                    queryBuilder.andWhere(`${dbField} = :value`, {value: filterValue});
                    break;
                case "NOT_EQUALS":
                    queryBuilder.andWhere(`${dbField} != :value`, {value: filterValue});
                    break;
                case "BETWEEN":
                    const [startRaw, endRaw] = filterValue.split(",").map(v => v.trim());
                    if (startRaw) {
                        const start = dayjs(startRaw).startOf("day").format("YYYY-MM-DD HH:mm:ss");
                        const end = endRaw
                            ? dayjs(endRaw).endOf("day").format("YYYY-MM-DD HH:mm:ss")
                            : dayjs(startRaw).endOf("day").format("YYYY-MM-DD HH:mm:ss");
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
        } else {
            queryBuilder.addOrderBy("unit.created_at", "DESC");
        }

        const [unitList, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedList = unitList.map(unit => ({
            ...unit,
            created_at: dayjs(unit.created_at).tz(TIMEZONE).format("YYYY-MM-DD"),
            updated_at: unit.updated_at ? dayjs(unit.updated_at).tz(TIMEZONE).format("YYYY-MM-DD") : null,
        }));

        return {
            list: formattedList,
            meta: MetaPagination(page, limit, total),
        };
    }

    /**
     * 🔍 Get unit detail
     */
    async getDetailData(id: string): Promise<EntityUnit | null> {
        const unit = await this.unitRepository
            .createQueryBuilder("unit")
            .leftJoinAndSelect("unit.property", "property")
            .where("unit.deleted_at IS NULL")
            .andWhere("unit.id = :id", {id})
            .getOne();

        return unit ?? null;
    }

    /**
     * ➕ Create a new unit
     */
    async createData(payload: CreateUnitRequest): Promise<Unit | null> {
        const unit = this.unitRepository.create({
            property_id: payload.property_id,
            name: payload.name,
            floor: payload.floor,
            living_area: payload.living_area,
        });

        const saved = await this.unitRepository.save(unit);
        return await this.getDetailData(saved.id);
    }

    /**
     * ✏️ Update an existing unit
     */
    async updateData(id: string, payload: UpdateUnitRequest): Promise<Unit | null> {
        const unit = await this.unitRepository.findOne({where: {id}});
        if (!unit) return null;

        if (payload.name !== undefined) unit.name = payload.name;
        if (payload.property_id !== undefined) unit.property_id = payload.property_id;
        if (payload.floor !== undefined) unit.floor = payload.floor;
        if (payload.living_area !== undefined) unit.living_area = payload.living_area;

        await this.unitRepository.save(unit);
        return await this.getDetailData(id);
    }

    /**
     * 🗑️ Soft delete a unit
     */
    async deleteData(id: string): Promise<void> {
        const unit = await this.unitRepository.findOne({where: {id}});
        if (!unit) return;

        unit.deleted_at = new Date();
        await this.unitRepository.save(unit);
    }
}