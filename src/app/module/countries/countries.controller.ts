import {Router} from "express";
import {CountriesService} from "./countries.service";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";
import {filterOperatorEnum} from "../../../lib/types/constanst/global";

/**
 * ✅ Controller for handling Countries routes
 */
export class CountriesController {
    public readonly router: Router = Router();

    constructor(private readonly countriesService: CountriesService) {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get("/", this.getAllData);
    }

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

            const properties = await this.countriesService.getAllData(page, limit, sortBy, order.toUpperCase() as "ASC" | "DESC", filterBy, filterValue, filterOperator);

            return ResponseSuccessBuilder(res, 200, "Success get all property data", properties);
        } catch (error) {
            next(error);
        }
    }
}