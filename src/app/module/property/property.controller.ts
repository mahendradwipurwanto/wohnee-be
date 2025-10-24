import {Router} from "express";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";

import {PropertyService} from "./property.service";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {CreatePropertyRequest, UpdatePropertyRequest} from "./property.dto";
import {filterOperatorEnum} from "../../../lib/types/constanst/global";
import {validateId} from "../../../lib/helper/common";

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

    // Admin

    // function to get all data
    getAllData = async (req, res, next) => {
        try {
            const filterBy: string = req.query.filter_by || "";
            const filterValue: string = req.query.filter_value || "";
            const filterOperator: string = req.query.filter_operator || "";

            //check filterOperator enum in filterOperatorEnum
            if (filterOperator && !filterOperatorEnum.includes(filterOperator)) {
                throw new CustomHttpExceptionError("Invalid filter operator", 400);
            }

            const page: number = (req.query.page == 0 ? 1 : req.query.page) || 1;
            const limit: number = req.query.limit || 10;
            const sortBy: string = req.query.sort || "order";
            const order: string = req.query.order || "ASC";

            const properties = await this.propertyService.getAllData(page, limit, sortBy, order.toUpperCase() as "ASC" | "DESC", filterBy, filterValue, filterOperator);

            return ResponseSuccessBuilder(res, 200, "Success get all property data", properties);
        } catch (error) {
            next(error);
        }
    }

    // function to get detail data
    getDetailData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            if (!id) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            validateId(id);

            const property = await this.propertyService.getDetailData(id);

            if (!property) {
                throw new CustomHttpExceptionError("Property not found", 404);
            }
            return ResponseSuccessBuilder(res, 200, "Success get property data", property);
        } catch (error) {
            next(error);
        }
    }

    // function to create data
    createData = async (req, res, next) => {
        try {
            const payload: CreatePropertyRequest = req.body;

            if (!payload) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            const org_id = req.id

            const property = await this.propertyService.createData(org_id, payload);

            return ResponseSuccessBuilder(res, 201, "Success create property data", property);
        } catch (error) {
            next(error);
        }
    }

    // function to update data
    updateData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            const payload: UpdatePropertyRequest = req.body;

            validateId(id);

            if (!id) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            // check if property exists
            const checkProperty = await this.propertyService.getDetailData(id);
            if (!checkProperty) {
                throw new CustomHttpExceptionError("Property not found", 404);
            }

            const property = await this.propertyService.updateData(id, payload);

            return ResponseSuccessBuilder(res, 200, "Success update property data", property);
        } catch (error) {
            next(error);
        }
    }

    // function to delete data
    deleteData = async (req, res, next) => {
        try {
            const id: string = req.params.id;

            validateId(id);

            if (!id) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            //check property
            const checkProperty = await this.propertyService.getDetailData(id);
            if (!checkProperty) {
                throw new CustomHttpExceptionError("Property not found", 404);
            }

            const property = await this.propertyService.deleteData(id);

            return ResponseSuccessBuilder(res, 200, "Success delete property data", property);
        } catch (error) {
            next(error);
        }
    }
}