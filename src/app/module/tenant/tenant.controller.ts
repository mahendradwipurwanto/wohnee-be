import { Router } from "express";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { TenantService } from "./tenant.service";
import { UnitService } from "../unit/unit.service";
import { OrganizationService } from "../organization/organization.service";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreateTenantRequest, UpdateTenantRequest } from "./tenant.dto";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";
import { validateId } from "../../../lib/helper/common";

/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Manage tenant data linked to property units and organizations
 */
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

    /**
     * @swagger
     * /tenant:
     *   get:
     *     summary: Get all tenants
     *     description: Retrieve a paginated list of tenants, optionally filtered or sorted by fields.
     *     tags: [Tenants]
     *     parameters:
     *       - in: query
     *         name: filter_by
     *         schema:
     *           type: string
     *           example: "email"
     *       - in: query
     *         name: filter_value
     *         schema:
     *           type: string
     *           example: "john.doe@email.com"
     *       - in: query
     *         name: filter_operator
     *         schema:
     *           type: string
     *           enum: [EQUAL, LIKE, IN, NOT_IN]
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           example: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           example: 10
     *       - in: query
     *         name: sort
     *         schema:
     *           type: string
     *           example: "created_at"
     *       - in: query
     *         name: order
     *         schema:
     *           type: string
     *           enum: [ASC, DESC]
     *           example: "ASC"
     *     responses:
     *       200:
     *         description: Success get all tenant data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 responseCode:
     *                   type: integer
     *                   example: 200
     *                 message:
     *                   type: string
     *                   example: Success get all tenant data
     *                 data:
     *                   type: object
     *                   properties:
     *                     list:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           id:
     *                             type: string
     *                             example: "d715d911-bb6b-41d2-8e8e-1b1d725df06d"
     *                           name:
     *                             type: string
     *                             example: "John Doe"
     *                           email:
     *                             type: string
     *                             example: "john.doe@email.com"
     *                           phone:
     *                             type: string
     *                             example: "+628123456789"
     *       400:
     *         description: Invalid filter operator
     */
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

    /**
     * @swagger
     * /tenant/{id}:
     *   get:
     *     summary: Get tenant detail
     *     description: Retrieve detailed tenant information by tenant ID.
     *     tags: [Tenants]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "d715d911-bb6b-41d2-8e8e-1b1d725df06d"
     *     responses:
     *       200:
     *         description: Success get tenant data
     *       404:
     *         description: Tenant not found
     */
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

    /**
     * @swagger
     * /tenant:
     *   post:
     *     summary: Create new tenant
     *     description: Create a new tenant linked to a property unit and organization.
     *     tags: [Tenants]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - email
     *               - org_id
     *               - unit_id
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Jane Smith"
     *               email:
     *                 type: string
     *                 example: "jane.smith@email.com"
     *               phone:
     *                 type: string
     *                 example: "+628223456789"
     *               org_id:
     *                 type: string
     *                 example: "a15c4ad2-c31e-4d17-8c88-1f51a8a23b3d"
     *               unit_id:
     *                 type: string
     *                 example: "c77c05b5-e9ad-4c8c-a122-9d15dcb58af1"
     *     responses:
     *       201:
     *         description: Success create tenant data
     *       400:
     *         description: Invalid payload
     *       404:
     *         description: Organization or Unit not found
     */
    createData = async (req, res, next) => {
        try {
            const payload: CreateTenantRequest = req.body;
            if (!payload) throw new CustomHttpExceptionError("Invalid payload", 400);

            validateId(payload.org_id);
            validateId(payload.unit_id);

            const organization = await this.organizationService.GetOrgByParams({ id: payload.org_id });
            if (!organization) throw new CustomHttpExceptionError("Organization not found", 404);

            const unit = await this.unitService.getDetailData(payload.unit_id);
            if (!unit) throw new CustomHttpExceptionError("Unit not found", 404);

            const tenant = await this.tenantService.createData(payload);
            return ResponseSuccessBuilder(res, 201, "Success create tenant data", tenant);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /tenant/{id}:
     *   put:
     *     summary: Update tenant data
     *     description: Update tenant details such as name, email, or contact information.
     *     tags: [Tenants]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "d715d911-bb6b-41d2-8e8e-1b1d725df06d"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "John Updated"
     *               email:
     *                 type: string
     *                 example: "updated@email.com"
     *               phone:
     *                 type: string
     *                 example: "+628999111222"
     *     responses:
     *       200:
     *         description: Success update tenant data
     *       404:
     *         description: Tenant not found
     */
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

    /**
     * @swagger
     * /tenant/{id}:
     *   delete:
     *     summary: Delete tenant (soft delete)
     *     description: Soft delete a tenant record by ID. The record will remain in the database but marked as deleted.
     *     tags: [Tenants]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "d715d911-bb6b-41d2-8e8e-1b1d725df06d"
     *     responses:
     *       200:
     *         description: Success delete tenant data
     *       404:
     *         description: Tenant not found
     */
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
