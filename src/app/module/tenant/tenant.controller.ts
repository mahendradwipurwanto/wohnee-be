import {Router} from "express";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";
import {TenantService} from "./tenant.service";
import {UnitService} from "../unit/unit.service";
import {OrganizationService} from "../organization/organization.service";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {CreateTenantRequest, UpdateTenantRequest} from "./tenant.dto";
import {filterOperatorEnum} from "../../../lib/types/constanst/global";
import {validateId} from "../../../lib/helper/common";

export class TenantController {
    public router: Router;
    private tenantService: TenantService;
    private unitService: UnitService;
    private organizationService: OrganizationService;

    constructor(
        tenantService: TenantService,
        unitService: UnitService,
        organizationService: OrganizationService
    ) {
        this.router = Router();
        this.tenantService = tenantService;
        this.unitService = unitService;
        this.organizationService = organizationService;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", this.getAllData);
        this.router.get("/:id", this.getDetailData);
        this.router.post("/", this.createData);
        this.router.put("/:id", this.updateData);
        this.router.delete("/:id", this.deleteData);
    }

    // ✅ Get all tenants
    getAllData = async (req, res, next) => {
        try {
            const filterBy: string = req.query.filter_by || "";
            const filterValue: string = req.query.filter_value || "";
            const filterOperator: string = req.query.filter_operator || "";

            if (filterOperator && !filterOperatorEnum.includes(filterOperator)) {
                throw new CustomHttpExceptionError("Invalid filter operator", 400);
            }

            const page: number = (req.query.page == 0 ? 1 : req.query.page) || 1;
            const limit: number = req.query.limit || 10;
            const sortBy: string = req.query.sort || "created_at";
            const order: string = req.query.order || "ASC";

            const tenants = await this.tenantService.getAllData(
                page,
                limit,
                sortBy,
                order.toUpperCase() as "ASC" | "DESC",
                filterBy,
                filterValue,
                filterOperator
            );

            return ResponseSuccessBuilder(res, 200, "Success get all tenant data", tenants);
        } catch (error) {
            next(error);
        }
    };

    // ✅ Get tenant detail
    getDetailData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            validateId(id);

            const tenant = await this.tenantService.getDetailData(id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            return ResponseSuccessBuilder(res, 200, "Success get tenant data", tenant);
        } catch (error) {
            next(error);
        }
    };

    // ✅ Create new tenant
    createData = async (req, res, next) => {
        try {
            const payload: CreateTenantRequest = req.body;
            if (!payload) throw new CustomHttpExceptionError("Invalid payload", 400);

            validateId(payload.org_id);
            validateId(payload.unit_id);

            // Check organization existence
            const organization = await this.organizationService.GetOrgByParams({
                id: payload.org_id,
            });
            if (!organization) throw new CustomHttpExceptionError("Organization not found", 404);

            // Check unit existence
            const unit = await this.unitService.getDetailData(payload.unit_id);
            if (!unit) throw new CustomHttpExceptionError("Unit not found", 404);

            const tenant = await this.tenantService.createData(payload);
            return ResponseSuccessBuilder(res, 201, "Success create tenant data", tenant);
        } catch (error) {
            next(error);
        }
    };

    // ✅ Update existing tenant
    updateData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            validateId(id);

            const payload: UpdateTenantRequest = req.body;
            const existing = await this.tenantService.getDetailData(id);
            if (!existing) throw new CustomHttpExceptionError("Tenant not found", 404);

            const updated = await this.tenantService.updateData(id, payload);
            return ResponseSuccessBuilder(res, 200, "Success update tenant data", updated);
        } catch (error) {
            next(error);
        }
    };

    // ✅ Soft delete tenant
    deleteData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            validateId(id);

            const existing = await this.tenantService.getDetailData(id);
            if (!existing) throw new CustomHttpExceptionError("Tenant not found", 404);

            await this.tenantService.deleteData(id);
            return ResponseSuccessBuilder(res, 200, "Success delete tenant data", null);
        } catch (error) {
            next(error);
        }
    };
}