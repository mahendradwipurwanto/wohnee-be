import { Router } from "express";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { UnitService } from "./unit.service";
import { PropertyService } from "../property/property.service";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreateUnitRequest, UpdateUnitRequest } from "./unit.dto";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";
import { validateId } from "../../../lib/helper/common";

/**
 * @swagger
 * tags:
 *   name: Units
 *   description: Manage property unit data (CRUD operations)
 */
export class UnitController {
    public router: Router;
    private unitService: UnitService;
    private propertyService: PropertyService;

    constructor(unitService: UnitService, propertyService: PropertyService) {
        this.router = Router();
        this.unitService = unitService;
        this.propertyService = propertyService;
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
     * /unit:
     *   get:
     *     summary: Get all units
     *     description: Retrieve a paginated list of property units, with optional filters and sorting.
     *     tags: [Units]
     *     parameters:
     *       - in: query
     *         name: filter_by
     *         schema:
     *           type: string
     *           example: "name"
     *       - in: query
     *         name: filter_value
     *         schema:
     *           type: string
     *           example: "Unit A"
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
     *         description: Success get all unit data
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
     *                   example: Success get all unit data
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
     *                             example: "a0b9ef11-8b3c-4c18-bb1d-0e9f113a8cdd"
     *                           name:
     *                             type: string
     *                             example: "Unit 201"
     *                           property_id:
     *                             type: string
     *                             example: "4d2f8b1a-4319-4a9c-a6cb-35eebf3a5de3"
     *                           status:
     *                             type: string
     *                             example: "Available"
     */
    getAllData = async (req, res, next) => {
        try {
            const filterBy: string = req.query.filter_by || "";
            const filterValue: string = req.query.filter_value || "";
            const filterOperator: string = req.query.filter_operator || "";

            if (filterOperator && !filterOperatorEnum.includes(filterOperator)) {
                throw new CustomHttpExceptionError("Invalid filter operator", 400);
            }

            const page: number = Number(req.query.page) || 1;
            const limit: number = Number(req.query.limit) || 10;
            const sortBy: string = req.query.sort || "created_at";
            const order: "ASC" | "DESC" = (req.query.order || "ASC").toUpperCase() as "ASC" | "DESC";

            const units = await this.unitService.getAllData(
                page,
                limit,
                sortBy,
                order,
                filterBy,
                filterValue,
                filterOperator
            );

            return ResponseSuccessBuilder(res, 200, "Success get all unit data", units);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /unit/{id}:
     *   get:
     *     summary: Get unit detail
     *     description: Retrieve detailed unit information by unit ID.
     *     tags: [Units]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "a0b9ef11-8b3c-4c18-bb1d-0e9f113a8cdd"
     *     responses:
     *       200:
     *         description: Success get unit data
     *       404:
     *         description: Unit not found
     */
    getDetailData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            if (!id) throw new CustomHttpExceptionError("Invalid payload", 400);

            validateId(id);

            const unit = await this.unitService.getDetailData(id);
            if (!unit) throw new CustomHttpExceptionError("Unit not found", 404);

            return ResponseSuccessBuilder(res, 200, "Success get unit data", unit);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /unit:
     *   post:
     *     summary: Create new unit
     *     description: Create a new unit linked to a property.
     *     tags: [Units]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - property_id
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Unit 302"
     *               description:
     *                 type: string
     *                 example: "Spacious 2-bedroom apartment"
     *               floor:
     *                 type: integer
     *                 example: 3
     *               property_id:
     *                 type: string
     *                 example: "4d2f8b1a-4319-4a9c-a6cb-35eebf3a5de3"
     *     responses:
     *       201:
     *         description: Success create unit data
     *       400:
     *         description: Property ID is required
     *       404:
     *         description: Property not found
     */
    createData = async (req, res, next) => {
        try {
            const payload: CreateUnitRequest = req.body;
            if (!payload) throw new CustomHttpExceptionError("Invalid payload", 400);

            if (!payload.property_id)
                throw new CustomHttpExceptionError("Property ID is required", 400);

            validateId(payload.property_id);

            const property = await this.propertyService.getDetailData(payload.property_id);
            if (!property) throw new CustomHttpExceptionError("Property not found", 404);

            const unit = await this.unitService.createData(payload);
            return ResponseSuccessBuilder(res, 201, "Success create unit data", unit);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /unit/{id}:
     *   put:
     *     summary: Update unit data
     *     description: Update unit details, optionally changing its linked property.
     *     tags: [Units]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "a0b9ef11-8b3c-4c18-bb1d-0e9f113a8cdd"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Updated Unit 302"
     *               floor:
     *                 type: integer
     *                 example: 4
     *               property_id:
     *                 type: string
     *                 example: "4d2f8b1a-4319-4a9c-a6cb-35eebf3a5de3"
     *     responses:
     *       200:
     *         description: Success update unit data
     *       404:
     *         description: Unit or Property not found
     */
    updateData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            const payload: UpdateUnitRequest = req.body;

            validateId(id);
            if (!id) throw new CustomHttpExceptionError("Invalid payload", 400);

            const existingUnit = await this.unitService.getDetailData(id);
            if (!existingUnit) throw new CustomHttpExceptionError("Unit not found", 404);

            if (payload.property_id) {
                validateId(payload.property_id);
                const property = await this.propertyService.getDetailData(payload.property_id);
                if (!property) throw new CustomHttpExceptionError("Property not found", 404);
            }

            const unit = await this.unitService.updateData(id, payload);
            return ResponseSuccessBuilder(res, 200, "Success update unit data", unit);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /unit/{id}:
     *   delete:
     *     summary: Delete unit (soft delete)
     *     description: Soft delete a unit record by its ID.
     *     tags: [Units]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "a0b9ef11-8b3c-4c18-bb1d-0e9f113a8cdd"
     *     responses:
     *       200:
     *         description: Success delete unit data
     *       404:
     *         description: Unit not found
     */
    deleteData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            validateId(id);

            if (!id) throw new CustomHttpExceptionError("Invalid payload", 400);

            const existingUnit = await this.unitService.getDetailData(id);
            if (!existingUnit) throw new CustomHttpExceptionError("Unit not found", 404);

            await this.unitService.deleteData(id);
            return ResponseSuccessBuilder(res, 200, "Success delete unit data", null);
        } catch (error) {
            next(error);
        }
    };
}