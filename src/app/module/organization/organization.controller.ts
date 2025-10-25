import { Router, RequestHandler } from "express";
import { OrganizationService } from "./organization.service";
import { UpdateOrganizationRequest } from "./organization.dto";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import logger from "../../../lib/helper/loggerHandler";
import { ensurePayloadNotEmpty, validateId } from "../../../lib/helper/common";
import ValidatorMiddleware from "../../middleware/validator.middleware";

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Manage organization data including retrieval, updates, and deletion
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
     * @swagger
     * /organization/{id}:
     *   get:
     *     summary: Get organization by ID
     *     description: Retrieve detailed information about a specific organization by its unique ID.
     *     tags: [Organizations]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Organization ID
     *     responses:
     *       200:
     *         description: Organization fetched successfully
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
     *                   example: Organization fetched successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: string
     *                       example: "be46dadf-3336-487a-b638-07f3c01de91"
     *                     name:
     *                       type: string
     *                       example: "Ngodingin HQ"
     *                     email:
     *                       type: string
     *                       example: "contact@ngodingin.org"
     *                     phone:
     *                       type: string
     *                       example: "+62855784252542"
     *                     created_at:
     *                       type: string
     *                       example: "2025-10-25T07:32:00Z"
     *       404:
     *         description: Organization not found
     */
    private getDataById: RequestHandler = async (req, res, next) => {
        const { id } = req.params;
        try {
            validateId(id);

            const organization = await this.organizationService.GetOrgByParams({ id });
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
     * @swagger
     * /organization/{id}:
     *   put:
     *     summary: Update organization data
     *     description: Update an organization's details by ID. Request body should include the fields to be updated.
     *     tags: [Organizations]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Organization ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 example: "Updated Organization"
     *               email:
     *                 type: string
     *                 example: "updated@ngodingin.org"
     *               phone:
     *                 type: string
     *                 example: "+6287778889999"
     *     responses:
     *       200:
     *         description: Organization updated successfully
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
     *                   example: Organization updated successfully
     *       400:
     *         description: Invalid request payload or update failed
     *       404:
     *         description: Organization not found
     */
    private updateData: RequestHandler = async (req, res, next) => {
        const { id } = req.params;
        const payload: UpdateOrganizationRequest = req.body;

        try {
            validateId(id);
            ensurePayloadNotEmpty(payload);

            const organization = await this.organizationService.GetOrgByParams({ id });
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
     * @swagger
     * /organization/{id}:
     *   delete:
     *     summary: Delete organization (soft delete)
     *     description: Soft deletes an organization record by ID. Data remains in the database but is marked as deleted.
     *     tags: [Organizations]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Organization ID
     *     responses:
     *       200:
     *         description: Organization deleted successfully
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
     *                   example: Organization deleted successfully
     *       404:
     *         description: Organization not found
     */
    private deleteData: RequestHandler = async (req, res, next) => {
        const { id } = req.params;

        try {
            validateId(id);

            const organization = await this.organizationService.GetOrgByParams({ id });
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