import {Repository} from "typeorm";
import MetaPagination from "../../../lib/helper/pagination";
import {EntityContact} from "./contact.model";
import {CreateContactRequest, UpdateContactRequest} from "./contact.dto";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";
import {Contact} from "../../../lib/types/data/contact";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");
const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

export class ContactService {
    constructor(private readonly contactRepository: Repository<EntityContact>) {
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
        const queryBuilder = this.contactRepository.createQueryBuilder("contact");

        queryBuilder
            .select([
                "contact.id",
                "contact.unit_id",
                "contact.contact_person",
                "contact.company",
                "contact.type",
                "contact.value",
                "contact.role",
                "contact.craft",
                "contact.created_at",
                "contact.updated_at",
                "contact.deleted_at",
                "unit.id",
                "unit.name",
            ])
            .leftJoin("contact.unit", "unit")
            .where("contact.deleted_at IS NULL");

        const filterFieldMap: Record<string, string> = {
            contact_person: "contact.contact_person",
            company: "contact.company",
            type: "contact.type",
            value: "contact.value",
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
                    queryBuilder.andWhere(`${dbField} = :value`, {value: filterValue});
                    break;
                case "NOT_EQUALS":
                    queryBuilder.andWhere(`${dbField} != :value`, {value: filterValue});
                    break;
                case "BETWEEN":
                    const [startRaw, endRaw] = filterValue.split(",").map(v => v.trim());
                    if (startRaw && endRaw) {
                        const start = dayjs(startRaw).startOf("day").format("YYYY-MM-DD HH:mm:ss");
                        const end = dayjs(endRaw).endOf("day").format("YYYY-MM-DD HH:mm:ss");
                        queryBuilder.andWhere(`${dbField} BETWEEN :start AND :end`, {start, end});
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

        const [contactList, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedList = contactList.map((c) => ({
            ...c,
            created_at: dayjs(c.created_at).tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        }));

        return {list: formattedList, meta: MetaPagination(page, limit, total)};
    }

    async getDetailData(id: string): Promise<EntityContact | null> {
        return this.contactRepository
            .createQueryBuilder("contact")
            .leftJoinAndSelect("contact.unit", "unit")
            .where("contact.deleted_at IS NULL")
            .andWhere("contact.id = :id", {id})
            .getOne();
    }

    async createData(payload: CreateContactRequest): Promise<Contact | null> {
        const newContact = this.contactRepository.create({
            unit_id: payload.unit_id,
            contact_person: payload.contact_person,
            company: payload.company,
            type: payload.type,
            value: payload.value,
            role: payload.role,
            craft: payload.craft,
        });

        const saved = await this.contactRepository.save(newContact);
        return this.getDetailData(saved.id);
    }

    async updateData(id: string, payload: UpdateContactRequest): Promise<Contact | null> {
        const contact = await this.contactRepository.findOne({where: {id}});
        if (!contact) return null;

        Object.assign(contact, payload);
        await this.contactRepository.save(contact);

        return this.getDetailData(id);
    }

    async deleteData(id: string): Promise<void> {
        const contact = await this.contactRepository.findOne({where: {id}});
        if (!contact) return;

        contact.deleted_at = new Date();
        await this.contactRepository.save(contact);
    }
}