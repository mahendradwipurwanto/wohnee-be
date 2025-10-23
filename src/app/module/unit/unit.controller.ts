import {Router} from "express";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";

import {UnitService} from "./unit.service";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {filterOperatorEnum} from "../../../lib/types/constants/global";
import {CreateFaqRequest} from "./unit.dto";
import loggerHandler from "../../../lib/helper/loggerHandler";

export class UnitController {
    public router: Router;
    private faqService: UnitService;

    constructor(faqService: UnitService) {
        this.router = Router();
        this.faqService = faqService;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // Admin
        this.router.get("/category/list", this.getAllCategoryData);
        this.router.get("/category/detail/:id", this.getDetailCategoryData);

        this.router.get("/list", this.getAllData);
        this.router.get("/detail/:id", this.getDetailData);
        this.router.post("/create", this.createData);
        this.router.put("/update/:id", this.updateData);
        this.router.delete("/delete/:id", this.deleteData);


        // Mobile
        this.router.get("/", this.getAll);
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

            const faqs = await this.faqService.getAllData(page, limit, sortBy, order.toUpperCase() as "ASC" | "DESC", filterBy, filterValue, filterOperator);

            return ResponseSuccessBuilder(res, 200, "Success get all property data", faqs);
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

            const faq = await this.faqService.getDetailData(id);

            if (!faq) {
                throw new CustomHttpExceptionError("Faq not found", 404);
            }
            return ResponseSuccessBuilder(res, 200, "Success get property data", faq);
        } catch (error) {
            next(error);
        }
    }

    // function to create data
    createData = async (req, res, next) => {
        try {
            const payload: CreateFaqRequest = req.body;

            if (!payload) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            const faq = await this.faqService.createData(payload);

            return ResponseSuccessBuilder(res, 201, "Success create property data", faq);
        } catch (error) {
            next(error);
        }
    }

    // function to update data
    updateData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            const payload: CreateFaqRequest = req.body;

            if (!id) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            // check if property exists
            const checkFaq = await this.faqService.getDetailData(id);
            if (!checkFaq) {
                throw new CustomHttpExceptionError("Faq not found", 404);
            }

            const faq = await this.faqService.updateData(id, payload);

            return ResponseSuccessBuilder(res, 200, "Success update property data", faq);
        } catch (error) {
            next(error);
        }
    }

    // function to delete data
    deleteData = async (req, res, next) => {
        try {
            const id: string = req.params.id;

            if (!id) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            //check property
            const checkFaq = await this.faqService.getDetailData(id);
            if (!checkFaq) {
                throw new CustomHttpExceptionError("Faq not found", 404);
            }

            const faq = await this.faqService.deleteData(id);

            return ResponseSuccessBuilder(res, 200, "Success delete property data", faq);
        } catch (error) {
            next(error);
        }
    }

    // function to get all data
    getAllCategoryData = async (req, res, next) => {
        try {
            loggerHandler.info(`Data faq ${req.path}`)

            const faqs = await this.faqService.getFaqCategory();

            return ResponseSuccessBuilder(res, 200, "Success get all property data", faqs);
        } catch (error) {
            next(error);
        }
    }

    // function to get detail data
    getDetailCategoryData = async (req, res, next) => {
        try {
            const id: string = req.params.id;
            if (!id) {
                throw new CustomHttpExceptionError("Invalid payload", 400);
            }

            const faq = await this.faqService.getFaqCategoryDetail(id);

            if (!faq) {
                throw new CustomHttpExceptionError("Faq not found", 404);
            }
            return ResponseSuccessBuilder(res, 200, "Success get property data", faq);
        } catch (error) {
            next(error);
        }
    }

    // function to get all data
    getAll = async (req, res, next) => {
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

            const faqs = await this.faqService.getAll(page, limit, sortBy, order.toUpperCase() as "ASC" | "DESC", filterBy, filterValue, filterOperator);

            return ResponseSuccessBuilder(res, 200, "Success get all property data", faqs);
        } catch (error) {
            next(error);
        }
    }
}