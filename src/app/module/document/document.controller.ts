import { Router } from "express";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { DocumentService } from "./document.service";
import { UnitService } from "../unit/unit.service";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreateDocumentRequest, UpdateDocumentRequest } from "./document.dto";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";
import { validateId } from "../../../lib/helper/common";

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Manage document records related to property units
 */
export class DocumentController {
    public router: Router;
    private documentService: DocumentService;
    private unitService: UnitService;

    constructor(documentService: DocumentService, unitService: UnitService) {
        this.router = Router();
        this.documentService = documentService;
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
     * /document:
     *   get:
     *     summary: Get all documents
     *     description: Retrieve all document data with pagination, sorting, and optional filtering.
     *     tags: [Documents]
     *     parameters:
     *       - in: query
     *         name: filter_by
     *         schema:
     *           type: string
     *           example: "name"
     *         description: Field to filter by
     *       - in: query
     *         name: filter_value
     *         schema:
     *           type: string
     *           example: "Ownership Certificate"
     *         description: Filter value
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
     *           example: "created_at"
     *       - in: query
     *         name: order
     *         schema:
     *           type: string
     *           enum: [ASC, DESC]
     *           example: "ASC"
     *     responses:
     *       200:
     *         description: Success get all document data
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
     *                   example: Success get all document data
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
     *                             example: "c983a15f-9121-44cb-8d47-6b9329e5b7f2"
     *                           name:
     *                             type: string
     *                             example: "Ownership Certificate"
     *                           unit_id:
     *                             type: string
     *                             example: "c2d94358-1e74-4e7d-829a-123f59e96f17"
     *                           type:
     *                             type: string
     *                             example: "Legal Document"
     *                           created_at:
     *                             type: string
     *                             example: "2025-10-25T06:12:00Z"
     *       400:
     *         description: Invalid filter operator
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

            const result = await this.documentService.getAllData(
                page, limit, sortBy, order, filterBy, filterValue, filterOperator
            );

            return ResponseSuccessBuilder(res, 200, "Success get all document data", result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /document/{id}:
     *   get:
     *     summary: Get document detail
     *     description: Retrieve detail of a single document by ID.
     *     tags: [Documents]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Document ID
     *     responses:
     *       200:
     *         description: Success get document detail
     *       404:
     *         description: Document not found
     */
    getDetailData = async (req, res, next) => {
        try {
            const id = req.params.id;
            validateId(id);

            const document = await this.documentService.getDetailData(id);
            if (!document) throw new CustomHttpExceptionError("Document not found", 404);

            return ResponseSuccessBuilder(res, 200, "Success get document detail", document);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /document:
     *   post:
     *     summary: Create new document
     *     description: Create a new document and link it to a unit.
     *     tags: [Documents]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - name
     *               - type
     *               - unit_id
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Lease Agreement"
     *               type:
     *                 type: string
     *                 example: "Legal Document"
     *               description:
     *                 type: string
     *                 example: "Signed rental contract for unit A2"
     *               unit_id:
     *                 type: string
     *                 example: "f31702ba-8d6d-4b5b-bd67-1a9ef0cb842e"
     *     responses:
     *       201:
     *         description: Success create document data
     *       400:
     *         description: Missing or invalid input
     *       404:
     *         description: Unit not found
     */
    createData = async (req, res, next) => {
        try {
            const payload: CreateDocumentRequest = req.body;
            if (!payload.unit_id) {
                throw new CustomHttpExceptionError("Unit ID is required", 400);
            }

            validateId(payload.unit_id);
            const unit = await this.unitService.getDetailData(payload.unit_id);
            if (!unit) throw new CustomHttpExceptionError("Unit not found", 404);

            const document = await this.documentService.createData(payload);
            return ResponseSuccessBuilder(res, 201, "Success create document data", document);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /document/{id}:
     *   put:
     *     summary: Update existing document
     *     description: Update document information by ID.
     *     tags: [Documents]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Document ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Updated Contract"
     *               description:
     *                 type: string
     *                 example: "Updated document after renewal"
     *               type:
     *                 type: string
     *                 example: "Contract"
     *     responses:
     *       200:
     *         description: Success update document data
     *       404:
     *         description: Document not found
     */
    updateData = async (req, res, next) => {
        try {
            const id = req.params.id;
            const payload: UpdateDocumentRequest = req.body;
            validateId(id);

            const existing = await this.documentService.getDetailData(id);
            if (!existing) throw new CustomHttpExceptionError("Document not found", 404);

            const updated = await this.documentService.updateData(id, payload);
            return ResponseSuccessBuilder(res, 200, "Success update document data", updated);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /document/{id}:
     *   delete:
     *     summary: Delete document
     *     description: Permanently delete a document by ID.
     *     tags: [Documents]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Success delete document data
     *       404:
     *         description: Document not found
     */
    deleteData = async (req, res, next) => {
        try {
            const id = req.params.id;
            validateId(id);

            const existing = await this.documentService.getDetailData(id);
            if (!existing) throw new CustomHttpExceptionError("Document not found", 404);

            await this.documentService.deleteData(id);
            return ResponseSuccessBuilder(res, 200, "Success delete document data", null);
        } catch (error) {
            next(error);
        }
    };
}