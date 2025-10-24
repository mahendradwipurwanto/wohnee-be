import {Router, RequestHandler} from "express";
import {OrganizationService} from "./organization.service";
import {UpdateOrganizationRequest} from "./organization.dto";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";
import logger from "../../../lib/helper/loggerHandler";
import {ensurePayloadNotEmpty, validateId} from "../../../lib/helper/common";
import ValidatorMiddleware from "../../middleware/validator.middleware";

/**
 * ✅ Controller for handling Organization routes
 */
export class OrganizationController {
    public readonly router: Router = Router();

    constructor(private readonly organizationService: OrganizationService) {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get("/:id", this.getDataById);
        this.router.put("/:id", ValidatorMiddleware(UpdateOrganizationRequest), this.updateData);
        this.router.delete("/:id", this.deleteData);
    }

    /**
     * ✅ GET /detail/:id
     * Fetch an organization by ID
     */
    private getDataById: RequestHandler = async (req, res, next) => {
        const {id} = req.params;
        try {
            validateId(id);

            const organization = await this.organizationService.GetOrgByParams({id});
            if (!organization) {
                throw new CustomHttpExceptionError(`Organization with ID ${id} not found`, 404);
            }

            ResponseSuccessBuilder(res, 200, "Organization fetched successfully", organization);
        } catch (error: any) {
            logger.error(`[Organization] ${error.message}`, {
                route: req.originalUrl,
                orgId: id,
            });
            next(error);
        }
    };

    /**
     * ✅ PUT /update/:id
     * Update organization safely
     */
    private updateData: RequestHandler = async (req, res, next) => {
        const {id} = req.params;
        const payload: UpdateOrganizationRequest = req.body;

        try {
            validateId(id);
            ensurePayloadNotEmpty(payload);

            const organization = await this.organizationService.GetOrgByParams({id});
            if (!organization) {
                throw new CustomHttpExceptionError(`Organization with ID ${id} not found`, 404);
            }

            const updatedOrg = await this.organizationService.updateData(id, payload);
            if (!updatedOrg) {
                throw new CustomHttpExceptionError(`Failed to update organization with ID ${id}`, 400);
            }

            ResponseSuccessBuilder(res, 200, "Organization updated successfully", updatedOrg);
        } catch (error: any) {
            logger.error(`[Organization] ${error.message}`, {
                route: req.originalUrl,
                orgId: id,
            });
            next(error);
        }
    };

    /**
     * ✅ DELETE /delete/:id
     * Soft delete organization
     */
    private deleteData: RequestHandler = async (req, res, next) => {
        const {id} = req.params;

        try {
            validateId(id);

            const organization = await this.organizationService.GetOrgByParams({id});
            if (!organization) {
                throw new CustomHttpExceptionError(`Organization with ID ${id} not found`, 404);
            }

            await this.organizationService.deleteData(id);

            ResponseSuccessBuilder(res, 200, "Organization deleted successfully", null);
        } catch (error: any) {
            logger.error(`[Organization] ${error.message}`, {
                route: req.originalUrl,
                orgId: id,
            });
            next(error);
        }
    };
}