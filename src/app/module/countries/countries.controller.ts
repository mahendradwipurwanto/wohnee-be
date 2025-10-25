import { Router } from "express";
import { CountriesService } from "./countries.service";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { filterOperatorEnum } from "../../../lib/types/constanst/global";

/**
 * @swagger
 * tags:
 *   name: Countries
 *   description: Endpoints for retrieving and filtering country data
 */
export class CountriesController {
    public readonly router: Router = Router();

    constructor(private readonly countriesService: CountriesService) {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get("/", this.getAllData);
    }

    /**
     * @swagger
     * /countries:
     *   get:
     *     summary: Get all countries
     *     description: Retrieve a paginated list of countries with optional filters and sorting.
     *     tags: [Countries]
     *     parameters:
     *       - in: query
     *         name: filter_by
     *         schema:
     *           type: string
     *           example: "name"
     *         description: Field name to filter by
     *       - in: query
     *         name: filter_value
     *         schema:
     *           type: string
     *           example: "Indonesia"
     *         description: Value to filter by
     *       - in: query
     *         name: filter_operator
     *         schema:
     *           type: string
     *           enum: [EQUAL, LIKE, IN, NOT_IN]
     *         description: Operator used for filtering results
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           example: 10
     *         description: Number of items per page
     *       - in: query
     *         name: sort
     *         schema:
     *           type: string
     *           example: "order"
     *         description: Field to sort by
     *       - in: query
     *         name: order
     *         schema:
     *           type: string
     *           enum: [ASC, DESC]
     *           example: "ASC"
     *         description: Sort order (ascending or descending)
     *     responses:
     *       200:
     *         description: Success get all country data
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
     *                   example: Success get all country data
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
     *                             example: "75c80db1-e5ef-41cb-b3f2-2c276423bc59"
     *                           name:
     *                             type: string
     *                             example: "Indonesia"
     *                           code:
     *                             type: string
     *                             example: "ID"
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

            const countries = await this.countriesService.getAllData(
                page,
                limit,
                sortBy,
                order.toUpperCase() as "ASC" | "DESC",
                filterBy,
                filterValue,
                filterOperator
            );

            return ResponseSuccessBuilder(res, 200, "Success get all country data", countries);
        } catch (error) {
            next(error);
        }
    };
}