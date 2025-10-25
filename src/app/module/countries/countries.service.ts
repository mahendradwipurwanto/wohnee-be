import {Repository} from "typeorm";
import MetaPagination from "../../../lib/helper/pagination";
import {EntityCountries} from "./countries.model";

export class CountriesService {
    constructor(private readonly countriesRepository: Repository<EntityCountries>) {
    }

    /**
     * Get paginated countries list with filter & sort
     */
    async getAllData(
        page: number,
        limit: number,
        sortBy: string,
        order: "ASC" | "DESC",
        filterBy: string,
        filterValue: string,
        filterOperator: string
    ) {
        const queryBuilder = this.countriesRepository.createQueryBuilder("countries");

        queryBuilder
            .select([
                "countries.id",
                "countries.name",
                "countries.code",
                "countries.dial_code",
            ]);

        // 🔍 Filter mapping
        const filterFieldMap: Record<string, string> = {
            name: "countries.name",
            code: "countries.code",
            dial_code: "countries.dial_code"
        };

        const defaultOperatorMap: Record<string, string> = {
            name: "LIKE",
            code: "LIKE",
            dial_code: "EQUALS"
        };

        const dbField = filterFieldMap[filterBy];

        if (dbField && filterValue) {
            const operator = (filterOperator || defaultOperatorMap[filterBy] || "LIKE").toUpperCase();

            switch (operator) {
                case "EQUALS":
                case "=":
                    queryBuilder.andWhere(`${dbField} = :value`, {value: filterValue});
                    break;
                case "NOT_EQUALS":
                case "!=":
                    queryBuilder.andWhere(`${dbField} != :value`, {value: filterValue});
                    break;
                case "GREATER":
                case ">=":
                    queryBuilder.andWhere(`${dbField} >= :value`, {value: filterValue});
                    break;
                case "LESS":
                case "<=":
                    queryBuilder.andWhere(`${dbField} <= :value`, {value: filterValue});
                    break;
                case "LIKE":
                default:
                    queryBuilder.andWhere(`LOWER(${dbField}) LIKE LOWER(:value)`, {
                        value: `%${filterValue.toLowerCase()}%`,
                    });
                    break;
            }
        }

        // Sorting
        if (sortBy && filterFieldMap[sortBy]) {
            queryBuilder.addOrderBy(filterFieldMap[sortBy], order);
        }

        const [countriesList, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const formattedList = countriesList.map((prop) => ({
            ...prop,
        }));

        return {
            list: formattedList,
            meta: MetaPagination(page, limit, total),
        };
    }
}