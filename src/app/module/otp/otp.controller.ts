import { Router } from "express";
import { OtpService } from "./otp.service";
import { ResponseSuccessBuilder } from "../../../lib/helper/response";
import { CustomHttpExceptionError } from "../../../lib/helper/errorHandler";
import { CreateOtpRequest, VerifyOtpRequest } from "./otp.dto";
import { TenantService } from "../tenant/tenant.service";

/**
 * @swagger
 * tags:
 *   name: OTP
 *   description: Endpoints for generating, resending, and verifying One-Time Passwords (OTP)
 */
export class OtpController {
    public router: Router;
    private otpService: OtpService;
    private tenantService: TenantService;

    constructor(otpService: OtpService, tenantService: TenantService) {
        this.router = Router();
        this.otpService = otpService;
        this.tenantService = tenantService;
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get("/:tenant_id", this.getOtp);
        this.router.post("/", this.createOtp);
        this.router.post("/resend", this.resendOtp);
        this.router.post("/verify", this.verifyOtp);
    }

    /**
     * @swagger
     * /otp/{tenant_id}:
     *   get:
     *     summary: Get latest OTP for a tenant
     *     description: Retrieve the most recent OTP generated for a specific tenant.
     *     tags: [OTP]
     *     parameters:
     *       - in: path
     *         name: tenant_id
     *         required: true
     *         schema:
     *           type: string
     *           example: "ac23fd81-9b19-4a2f-9233-d3c4a0bb9f45"
     *         description: Tenant ID to fetch OTP for
     *     responses:
     *       200:
     *         description: Success get OTP
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
     *                   example: Success get OTP
     *                 data:
     *                   type: object
     *                   properties:
     *                     otp:
     *                       type: string
     *                       example: "843216"
     *                     expired_at:
     *                       type: string
     *                       example: "2025-10-25T08:10:00Z"
     *       400:
     *         description: Tenant ID required
     *       404:
     *         description: Tenant not found
     */
    getOtp = async (req, res, next) => {
        try {
            const { tenant_id } = req.params;
            if (!tenant_id) throw new CustomHttpExceptionError("Tenant ID required", 400);

            const tenant = await this.tenantService.getDetailData(tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const otp = await this.otpService.getOtp(tenant_id);
            return ResponseSuccessBuilder(res, 200, "Success get OTP", otp);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /otp:
     *   post:
     *     summary: Create new OTP
     *     description: Generate a new OTP for a tenant. Typically used during registration or login verification.
     *     tags: [OTP]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - tenant_id
     *             properties:
     *               tenant_id:
     *                 type: string
     *                 example: "ac23fd81-9b19-4a2f-9233-d3c4a0bb9f45"
     *     responses:
     *       201:
     *         description: OTP created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 responseCode:
     *                   type: integer
     *                   example: 201
     *                 message:
     *                   type: string
     *                   example: OTP created successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     otp:
     *                       type: string
     *                       example: "912845"
     *                     expired_at:
     *                       type: string
     *                       example: "2025-10-25T08:30:00Z"
     *       400:
     *         description: Invalid payload
     *       404:
     *         description: Tenant not found
     */
    createOtp = async (req, res, next) => {
        try {
            const payload: CreateOtpRequest = req.body;
            if (!payload.tenant_id) throw new CustomHttpExceptionError("Invalid payload", 400);

            const tenant = await this.tenantService.getDetailData(payload.tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const otp = await this.otpService.createOtp(payload);
            return ResponseSuccessBuilder(res, 201, "OTP created successfully", otp);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /otp/resend:
     *   post:
     *     summary: Resend OTP
     *     description: Resend the most recent OTP for a tenant. Generates a new OTP if none exists.
     *     tags: [OTP]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - tenant_id
     *             properties:
     *               tenant_id:
     *                 type: string
     *                 example: "ac23fd81-9b19-4a2f-9233-d3c4a0bb9f45"
     *     responses:
     *       201:
     *         description: OTP resent successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 responseCode:
     *                   type: integer
     *                   example: 201
     *                 message:
     *                   type: string
     *                   example: OTP resent successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     otp:
     *                       type: string
     *                       example: "981245"
     *                     expired_at:
     *                       type: string
     *                       example: "2025-10-25T08:35:00Z"
     *       400:
     *         description: Invalid payload
     *       404:
     *         description: Tenant not found
     */
    resendOtp = async (req, res, next) => {
        try {
            const payload: CreateOtpRequest = req.body;
            if (!payload.tenant_id) throw new CustomHttpExceptionError("Invalid payload", 400);

            const tenant = await this.tenantService.getDetailData(payload.tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const otp = await this.otpService.resendOtp(payload);
            return ResponseSuccessBuilder(res, 201, "OTP resent successfully", otp);
        } catch (error) {
            next(error);
        }
    };

    /**
     * @swagger
     * /otp/verify:
     *   post:
     *     summary: Verify OTP
     *     description: Validate OTP against tenant record. Used to confirm tenant’s identity during sign-in or registration.
     *     tags: [OTP]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - tenant_id
     *               - otp
     *             properties:
     *               tenant_id:
     *                 type: string
     *                 example: "ac23fd81-9b19-4a2f-9233-d3c4a0bb9f45"
     *               otp:
     *                 type: string
     *                 example: "912845"
     *     responses:
     *       200:
     *         description: OTP verified successfully
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
     *                   example: OTP verified successfully
     *                 data:
     *                   type: object
     *                   properties:
     *                     verified:
     *                       type: boolean
     *                       example: true
     *                     tenant_id:
     *                       type: string
     *                       example: "ac23fd81-9b19-4a2f-9233-d3c4a0bb9f45"
     *       400:
     *         description: Invalid or expired OTP
     *       404:
     *         description: Tenant not found
     */
    verifyOtp = async (req, res, next) => {
        try {
            const payload: VerifyOtpRequest = req.body;
            if (!payload.tenant_id || !payload.otp) throw new CustomHttpExceptionError("Invalid payload", 400);

            const tenant = await this.tenantService.getDetailData(payload.tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const result = await this.otpService.verifyOtp(payload);
            return ResponseSuccessBuilder(res, 200, result.message, result);
        } catch (error) {
            next(error);
        }
    };
}