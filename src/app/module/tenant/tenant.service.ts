import {Repository} from "typeorm";
import MetaPagination from "../../../lib/helper/pagination";
import {EntityTenant} from "./tenant.model";
import {EntityTenantData} from "./tenant-data.model";
import {CreateTenantRequest, UpdateTenantRequest} from "./tenant.dto";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/id";
import {Tenant} from "../../../lib/types/data/tenant";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");
const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

export class TenantService {
    constructor(private readonly tenantRepository: Repository<EntityTenant>) {
    }

    /** ✅ Get paginated tenant list with filters, sorting, and relations */
    async getAllData(
        page: number,
        limit: number,
        sortBy: string,
        order: "ASC" | "DESC",
        filterBy: string,
        filterValue: string,
        filterOperator: string
    ) {
        const queryBuilder = this.tenantRepository.createQueryBuilder("tenant");

        queryBuilder
            .select([
                "tenant.id",
                "tenant.org_id",
                "tenant.unit_id",
                "tenant.email",
                "tenant.phone",
                "tenant.telegram_id",
                "tenant.lang",
                "tenant.style",
                "tenant.status",
                "tenant.created_at",
                "tenant.updated_at",
                "tenant.deleted_at",
                "tenant_data.id",
                "tenant_data.first_name",
                "tenant_data.last_name",
                "tenant_data.salutation",
                "unit.id",
                "unit.name",
                "unit.floor",
                "unit.living_area",
                "organization.id",
                "organization_data.name",
                "organization_data.email",
                "organization_data.phone",
                "organization_data.profile",
            ])
            .leftJoin("tenant.tenant_data", "tenant_data")
            .leftJoin("tenant.unit", "unit")
            .leftJoin("tenant.organization", "organization")
            .leftJoin("organization.organization_data", "organization_data")
            .where("tenant.deleted_at IS NULL");

        /** 🧩 Filter mapping */
        const filterFieldMap: Record<string, string> = {
            email: "tenant.email",
            phone: "tenant.phone",
            lang: "tenant.lang",
            status: "tenant.status",
            created_at: "tenant.created_at",
        };

        const defaultOperatorMap: Record<string, string> = {
            email: "LIKE",
            phone: "LIKE",
            lang: "LIKE",
            status: "EQUALS",
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

        /** 🧭 Sorting */
        if (sortBy && filterFieldMap[sortBy]) {
            queryBuilder.addOrderBy(filterFieldMap[sortBy], order);
        }

        const [tenantList, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedList = tenantList.map((tenant) => ({
            ...tenant,
            created_at: dayjs(tenant.created_at).tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        }));

        return {
            list: formattedList,
            meta: MetaPagination(page, limit, total),
        };
    }

    /** ✅ Get single tenant detail with relations */
    async getDetailData(id: string): Promise<EntityTenant | null> {
        return this.tenantRepository
            .createQueryBuilder("tenant")
            .leftJoinAndSelect("tenant.tenant_data", "tenant_data")
            .leftJoinAndSelect("tenant.unit", "unit")
            .leftJoinAndSelect("tenant.organization", "organization")
            .leftJoinAndSelect("organization.organization_data", "organization_data")
            .where("tenant.deleted_at IS NULL")
            .andWhere("tenant.id = :id", {id})
            .getOne();
    }

    /** ✅ Create tenant with related tenant_data */
    async createData(payload: CreateTenantRequest): Promise<Tenant | null> {
        // Create main tenant entity
        const newTenant = this.tenantRepository.create({
            org_id: payload.org_id,
            unit_id: payload.unit_id,
            email: payload.email,
            phone: payload.phone,
            telegram_id: payload.telegram_id,
            lang: payload.lang,
            style: payload.style,
            status: payload.status ?? 1,
        });

        const savedTenant = await this.tenantRepository.save(newTenant);

        // Save related tenant_data
        const tenantDataRepo = this.tenantRepository.manager.getRepository(EntityTenantData);
        const tenantData = tenantDataRepo.create({
            tenant_id: savedTenant.id,
            first_name: payload.first_name,
            last_name: payload.last_name,
            salutation: payload.salutation,
        });

        await tenantDataRepo.save(tenantData);

        return this.getDetailData(savedTenant.id);
    }

    /** ✅ Update tenant and tenant_data */
    async updateData(id: string, payload: UpdateTenantRequest): Promise<Tenant | null> {
        const tenant = await this.tenantRepository.findOne({where: {id}});
        if (!tenant) return null;

        Object.assign(tenant, {
            email: payload.email ?? tenant.email,
            phone: payload.phone ?? tenant.phone,
            telegram_id: payload.telegram_id ?? tenant.telegram_id,
            lang: payload.lang ?? tenant.lang,
            style: payload.style ?? tenant.style,
            status: payload.status ?? tenant.status,
        });

        await this.tenantRepository.save(tenant);

        // Update related tenant_data
        const tenantDataRepo = this.tenantRepository.manager.getRepository(EntityTenantData);
        let tenantData = await tenantDataRepo.findOne({where: {tenant_id: id}});

        if (!tenantData) {
            tenantData = tenantDataRepo.create({tenant_id: id});
        }

        Object.assign(tenantData, {
            first_name: payload.first_name ?? tenantData.first_name,
            last_name: payload.last_name ?? tenantData.last_name,
            salutation: payload.salutation ?? tenantData.salutation,
        });

        await tenantDataRepo.save(tenantData);

        return this.getDetailData(id);
    }

    /** ✅ Soft delete tenant and related tenant_data */
    async deleteData(id: string): Promise<void> {
        const tenant = await this.tenantRepository.findOne({where: {id}});
        if (!tenant) return;

        tenant.deleted_at = new Date();
        await this.tenantRepository.save(tenant);

        const tenantDataRepo = this.tenantRepository.manager.getRepository(EntityTenantData);
        const tenantData = await tenantDataRepo.findOne({where: {tenant_id: id}});

        if (tenantData) {
            tenantData.salutation = "[DELETED]";
            await tenantDataRepo.save(tenantData);
        }
    }
}