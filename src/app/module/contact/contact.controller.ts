import { Router } from "express";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { ContactService } from "./contact.service";
import { UnitService } from "../unit/unit.service";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreateContactRequest, UpdateContactRequest } from "./contact.dto";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";
import { validateId } from "../../../lib/helper/common";

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Manage contact data associated with property units
 */
export class ContactController {
    public router: Router;
    private contactService: ContactService;
    private unitService: UnitService;

    constructor(contactService: ContactService, unitService: UnitService) {
        this.router = Router();
        this.contactService = contactService;
        this.unitService = unitService;
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
     * /contact:
     *   get:
     *     summary: Get all contacts
     *     description: Retrieve a paginated list of contacts. Supports optional filters, sorting, and pagination.
     *     tags: [Contacts]
     *     parameters:
     *       - in: query
     *         name: filter_by
     *         schema:
     *           type: string
     *         description: Field to filter by (e.g. name, email)
     *       - in: query
     *         name: filter_value
     *         schema:
     *           type: string
     *         description: Value to filter by
     *       - in: query
     *         name: filter_operator
     *         schema:
     *           type: string
     *           enum: [EQUAL, LIKE, IN, NOT_IN]
     *         description: Operator used for filtering
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
     *           example: created_at
     *       - in: query
     *         name: order
     *         schema:
     *           type: string
     *           enum: [ASC, DESC]
     *           example: ASC
     *     responses:
     *       200:
     *         description: Success get all contact data
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
     *                   example: Success get all contact data
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
     *                           name:
     *                             type: string
     *                           phone:
     *                             type: string
     */
    getAllData = async (req, res, next) => {
        try {
            const filterBy = req.query.filter_by || "";
            const filterValue = req.query.filter_value || "";
            const filterOperator = req.query.filter_operator || "";

            if (filterOperator && !filterOperatorEnum.includes(filterOperator)) {
                throw new CustomHttpExceptionError("Invalid filter operator", 400);
            }

            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const sortBy = req.query.sort || "created_at";
            const order = (req.query.order || "ASC").toUpperCase() as "ASC" | "DESC";

            const result = await this.contactService.getAllData(
                page, limit, sortBy, order, filterBy, filterValue, filterOperator
            );

            return ResponseSuccessBuilder(res, 200, "Success get all contact data", result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /contact/{id}:
     *   get:
     *     summary: Get contact detail
     *     description: Fetch a single contact by its ID.
     *     tags: [Contacts]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Contact ID
     *     responses:
     *       200:
     *         description: Success get contact detail
     *       404:
     *         description: Contact not found
     */
    getDetailData = async (req, res, next) => {
        try {
            const id = req.params.id;
            validateId(id);

            const contact = await this.contactService.getDetailData(id);
            if (!contact) throw new CustomHttpExceptionError("Contact not found", 404);

            return ResponseSuccessBuilder(res, 200, "Success get contact detail", contact);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /contact:
     *   post:
     *     summary: Create a new contact
     *     description: Creates a new contact and associates it with a unit.
     *     tags: [Contacts]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - phone
     *               - unit_id
     *             properties:
     *               name:
     *                 type: string
     *                 example: "John Doe"
     *               phone:
     *                 type: string
     *                 example: "+628123456789"
     *               email:
     *                 type: string
     *                 example: "john.doe@email.com"
     *               unit_id:
     *                 type: string
     *                 example: "f31702ba-8d6d-4b5b-bd67-1a9ef0cb842e"
     *     responses:
     *       201:
     *         description: Success create contact data
     *       400:
     *         description: Invalid or missing input data
     *       404:
     *         description: Unit not found
     */
    createData = async (req, res, next) => {
        try {
            const payload: CreateContactRequest = req.body;
            if (!payload.unit_id) throw new CustomHttpExceptionError("Unit ID is required", 400);

            validateId(payload.unit_id);
            const unit = await this.unitService.getDetailData(payload.unit_id);
            if (!unit) throw new CustomHttpExceptionError("Unit not found", 404);

            const contact = await this.contactService.createData(payload);
            return ResponseSuccessBuilder(res, 201, "Success create contact data", contact);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /contact/{id}:
     *   put:
     *     summary: Update contact data
     *     description: Updates a contact's details by ID.
     *     tags: [Contacts]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Contact ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Jane Doe"
     *               phone:
     *                 type: string
     *                 example: "+628111222333"
     *               email:
     *                 type: string
     *                 example: "jane.doe@email.com"
     *     responses:
     *       200:
     *         description: Success update contact data
     *       404:
     *         description: Contact not found
     */
    updateData = async (req, res, next) => {
        try {
            const id = req.params.id;
            const payload: UpdateContactRequest = req.body;

            validateId(id);

            const existing = await this.contactService.getDetailData(id);
            if (!existing) throw new CustomHttpExceptionError("Contact not found", 404);

            const updated = await this.contactService.updateData(id, payload);
            return ResponseSuccessBuilder(res, 200, "Success update contact data", updated);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /contact/{id}:
     *   delete:
     *     summary: Delete contact
     *     description: Permanently deletes a contact by ID.
     *     tags: [Contacts]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success delete contact data
     *       404:
     *         description: Contact not found
     */
    deleteData = async (req, res, next) => {
        try {
            const id = req.params.id;
            validateId(id);

            const existing = await this.contactService.getDetailData(id);
            if (!existing) throw new CustomHttpExceptionError("Contact not found", 404);

            await this.contactService.deleteData(id);
            return ResponseSuccessBuilder(res, 200, "Success delete contact data", null);
        } catch (error) {
            next(error);
        }
    };
}