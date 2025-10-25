import { Router } from "express";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { PropertyService } from "./property.service";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreatePropertyRequest, UpdatePropertyRequest } from "./property.dto";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";
import { validateId } from "../../../lib/helper/common";

/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Manage property records including creation, update, and retrieval
 */
export class PropertyController {
    public router: Router;
    private propertyService: PropertyService;

    constructor(propertyService: PropertyService) {
        this.router = Router();
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
     * /property:
     *   get:
     *     summary: Get all properties
     *     description: Retrieve a paginated list of properties with filtering and sorting options.
     *     tags: [Properties]
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
     *           example: "Apartment"
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
     *           example: "order"
     *       - in: query
     *         name: order
     *         schema:
     *           type: string
     *           enum: [ASC, DESC]
     *           example: "ASC"
     *     responses:
     *       200:
     *         description: Success get all property data
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
     *                   example: Success get all property data
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
     *                             example: "b67f8a2e-77a5-48d3-9041-f6232cb6db5f"
     *                           name:
     *                             type: string
     *                             example: "Greenwood Apartments"
     *                           location:
     *                             type: string
     *                             example: "Jakarta, Indonesia"
     *                           order:
     *                             type: integer
     *                             example: 1
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
            const sortBy: string = req.query.sort || "order";
            const order: string = req.query.order || "ASC";

            const properties = await this.propertyService.getAllData(
                page,
                limit,
                sortBy,
                order.toUpperCase() as "ASC" | "DESC",
                filterBy,
                filterValue,
                filterOperator
            );

            return ResponseSuccessBuilder(res, 200, "Success get all property data", properties);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /property/{id}:
     *   get:
     *     summary: Get property detail
     *     description: Retrieve detailed information about a specific property by ID.
     *     tags: [Properties]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "b67f8a2e-77a5-48d3-9041-f6232cb6db5f"
     *         description: Property ID
     *     responses:
     *       200:
     *         description: Success get property data
     *       404:
     *         description: Property not found
     */
    getDetailData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            if (!id) throw new CustomHttpExceptionError("Invalid payload", 400);

            validateId(id);

            const property = await this.propertyService.getDetailData(id);
            if (!property) throw new CustomHttpExceptionError("Property not found", 404);

            return ResponseSuccessBuilder(res, 200, "Success get property data", property);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /property:
     *   post:
     *     summary: Create new property
     *     description: Create a new property record for the authenticated organization.
     *     tags: [Properties]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - address
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Sunset Residence"
     *               address:
     *                 type: string
     *                 example: "Jl. Merdeka Raya No. 12, Bandung"
     *               city:
     *                 type: string
     *                 example: "Bandung"
     *               province:
     *                 type: string
     *                 example: "Jawa Barat"
     *               postal_code:
     *                 type: string
     *                 example: "40123"
     *               latitude:
     *                 type: number
     *                 example: -6.917464
     *               longitude:
     *                 type: number
     *                 example: 107.619123
     *     responses:
     *       201:
     *         description: Success create property data
     *       400:
     *         description: Invalid payload
     */
    createData = async (req, res, next) => {
        try {
            const payload: CreatePropertyRequest = req.body;
            if (!payload) throw new CustomHttpExceptionError("Invalid payload", 400);

            const org_id = req.id;
            const property = await this.propertyService.createData(org_id, payload);

            return ResponseSuccessBuilder(res, 201, "Success create property data", property);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /property/{id}:
     *   put:
     *     summary: Update property
     *     description: Update property information by its ID.
     *     tags: [Properties]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "b67f8a2e-77a5-48d3-9041-f6232cb6db5f"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Updated Residence"
     *               address:
     *                 type: string
     *                 example: "Jl. Dipatiukur No. 22, Bandung"
     *               postal_code:
     *                 type: string
     *                 example: "40132"
     *     responses:
     *       200:
     *         description: Success update property data
     *       404:
     *         description: Property not found
     */
    updateData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            const payload: UpdatePropertyRequest = req.body;

            validateId(id);
            if (!id) throw new CustomHttpExceptionError("Invalid payload", 400);

            const checkProperty = await this.propertyService.getDetailData(id);
            if (!checkProperty) throw new CustomHttpExceptionError("Property not found", 404);

            const property = await this.propertyService.updateData(id, payload);
            return ResponseSuccessBuilder(res, 200, "Success update property data", property);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /property/{id}:
     *   delete:
     *     summary: Delete property
     *     description: Permanently delete a property record by its ID.
     *     tags: [Properties]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           example: "b67f8a2e-77a5-48d3-9041-f6232cb6db5f"
     *     responses:
     *       200:
     *         description: Success delete property data
     *       404:
     *         description: Property not found
     */
    deleteData = async (req, res, next) => {
        try {
            const id: string = req.params.id;

            validateId(id);
            if (!id) throw new CustomHttpExceptionError("Invalid payload", 400);

            const checkProperty = await this.propertyService.getDetailData(id);
            if (!checkProperty) throw new CustomHttpExceptionError("Property not found", 404);

            const property = await this.propertyService.deleteData(id);
            return ResponseSuccessBuilder(res, 200, "Success delete property data", property);
        } catch (error) {
            next(error);
        }
    };
}
