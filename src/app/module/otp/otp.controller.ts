import {Router} from "express";
import {OtpService} from "./otp.service";
import {ResponseSuccessBuilder} from "../../../lib/helper/response";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";
import {CreateOtpRequest, VerifyOtpRequest} from "./otp.dto";
import {TenantService} from "../tenant/tenant.service";

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

    /** ✅ Get latest OTP */
    getOtp = async (req, res, next) => {
        try {
            const {tenant_id} = req.params;
            if (!tenant_id) throw new CustomHttpExceptionError("Tenant ID required", 400);

            // check if tenant exists
            const tenant = await this.tenantService.getDetailData(tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const otp = await this.otpService.getOtp(tenant_id);
            return ResponseSuccessBuilder(res, 200, "Success get OTP", otp);
        } catch (error) {
            next(error);
        }
    };

    /** ✅ Create new OTP */
    createOtp = async (req, res, next) => {
        try {
            const payload: CreateOtpRequest = req.body;
            if (!payload.tenant_id) throw new CustomHttpExceptionError("Invalid payload", 400);

            // check if tenant exists
            const tenant = await this.tenantService.getDetailData(payload.tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const otp = await this.otpService.createOtp(payload);
            return ResponseSuccessBuilder(res, 201, "OTP created successfully", otp);
        } catch (error) {
            next(error);
        }
    };

    /** ✅ Resend OTP */
    resendOtp = async (req, res, next) => {
        try {
            const payload: CreateOtpRequest = req.body;
            if (!payload.tenant_id) throw new CustomHttpExceptionError("Invalid payload", 400);

            // check if tenant exists
            const tenant = await this.tenantService.getDetailData(payload.tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const otp = await this.otpService.resendOtp(payload);
            return ResponseSuccessBuilder(res, 201, "OTP resent successfully", otp);
        } catch (error) {
            next(error);
        }
    };

    /** ✅ Verify OTP */
    verifyOtp = async (req, res, next) => {
        try {
            const payload: VerifyOtpRequest = req.body;
            if (!payload.tenant_id || !payload.otp) throw new CustomHttpExceptionError("Invalid payload", 400);

            // check if tenant exists
            const tenant = await this.tenantService.getDetailData(payload.tenant_id);
            if (!tenant) throw new CustomHttpExceptionError("Tenant not found", 404);

            const result = await this.otpService.verifyOtp(payload);
            return ResponseSuccessBuilder(res, 200, result.message, result);
        } catch (error) {
            next(error);
        }
    };
}