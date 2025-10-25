import { Router } from "express";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { DocumentService } from "./document.service";
import { UnitService } from "../unit/unit.service";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreateDocumentRequest, UpdateDocumentRequest } from "./document.dto";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";
import { validateId } from "../../../lib/helper/common";

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