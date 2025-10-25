import { Router } from "express";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { UnitService } from "./unit.service";
import { PropertyService } from "../property/property.service"; // ✅ import PropertyService
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreateUnitRequest, UpdateUnitRequest } from "./unit.dto";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";
import { validateId } from "../../../lib/helper/common";

export class UnitController {
    public router: Router;
    private unitService: UnitService;
    private propertyService: PropertyService; // ✅ added property service

    constructor(unitService: UnitService, propertyService: PropertyService) {
        this.router = Router();
        this.unitService = unitService;
        this.propertyService = propertyService; // ✅ initialize
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/", this.getAllData);
        this.router.get("/:id", this.getDetailData);
        this.router.post("/", this.createData);
        this.router.put("/:id", this.updateData);
        this.router.delete("/:id", this.deleteData);
    }

    // ✅ Get all unit data
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

            const units = await this.unitService.getAllData(page, limit, sortBy, order, filterBy, filterValue, filterOperator);

            return ResponseSuccessBuilder(res, 200, "Success get all unit data", units);
        } catch (error) {
            next(error);
        }
    };

    // ✅ Get detail unit
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

    // ✅ Create new unit (check property_id)
    createData = async (req, res, next) => {
        try {
            const payload: CreateUnitRequest = req.body;
            if (!payload) throw new CustomHttpExceptionError("Invalid payload", 400);

            // ✅ Ensure property_id exists
            if (!payload.property_id) {
                throw new CustomHttpExceptionError("Property ID is required", 400);
            }

            validateId(payload.property_id);

            const property = await this.propertyService.getDetailData(payload.property_id);
            if (!property) {
                throw new CustomHttpExceptionError("Property not found", 404);
            }

            const unit = await this.unitService.createData(payload);
            return ResponseSuccessBuilder(res, 201, "Success create unit data", unit);
        } catch (error) {
            next(error);
        }
    };

    // ✅ Update existing unit (check property_id if provided)
    updateData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            const payload: UpdateUnitRequest = req.body;

            validateId(id);

            if (!id) throw new CustomHttpExceptionError("Invalid payload", 400);

            // ✅ Check if unit exists
            const existingUnit = await this.unitService.getDetailData(id);
            if (!existingUnit) throw new CustomHttpExceptionError("Unit not found", 404);

            // ✅ If property_id is included, validate it
            if (payload.property_id) {
                validateId(payload.property_id);

                const property = await this.propertyService.getDetailData(payload.property_id);
                if (!property) {
                    throw new CustomHttpExceptionError("Property not found", 404);
                }
            }

            const unit = await this.unitService.updateData(id, payload);
            return ResponseSuccessBuilder(res, 200, "Success update unit data", unit);
        } catch (error) {
            next(error);
        }
    };

    // ✅ Soft delete unit
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