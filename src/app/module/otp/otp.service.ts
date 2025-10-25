import {Repository} from "typeorm";
import {EntityOtp} from "./otp.model";
import {CreateOtpRequest, VerifyOtpRequest} from "./otp.dto";
import dayjs from "dayjs";
import {CustomHttpExceptionError} from "../../../lib/helper/errorHandler";

export class OtpService {
    constructor(private readonly otpRepository: Repository<EntityOtp>) {
    }

    /** ✅ Get latest OTP for tenant */
    async getOtp(tenant_id: string): Promise<EntityOtp | null> {
        return this.otpRepository
            .createQueryBuilder("otp")
            .where("otp.tenant_id = :tenant_id", {tenant_id})
            .andWhere("otp.deleted_at IS NULL")
            .orderBy("otp.created_at", "DESC")
            .getOne();
    }

    /** ✅ Create new OTP (generate & save) */
    async createOtp(payload: CreateOtpRequest): Promise<EntityOtp> {
        // Invalidate previous OTPs
        await this.otpRepository
            .createQueryBuilder()
            .update(EntityOtp)
            .set({status: 2}) // mark as expired
            .where("tenant_id = :tenant_id", {tenant_id: payload.tenant_id})
            .execute();

        // Generate 6-digit random OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryTime = dayjs().add(5, "minute").toDate(); // 5 minutes validity

        const newOtp = this.otpRepository.create({
            tenant_id: payload.tenant_id,
            otp: otpCode,
            expired_at: expiryTime,
            status: 0,
        });

        return await this.otpRepository.save(newOtp);
    }

    /** ✅ Resend OTP (generate new one & invalidate old) */
    async resendOtp(payload: CreateOtpRequest): Promise<EntityOtp> {
        // Invalidate previous OTPs
        await this.otpRepository
            .createQueryBuilder()
            .update(EntityOtp)
            .set({status: 2})
            .where("tenant_id = :tenant_id", {tenant_id: payload.tenant_id})
            .execute();

        // Generate new one
        return this.createOtp(payload);
    }

    /** ✅ Verify OTP */
    async verifyOtp(payload: VerifyOtpRequest): Promise<{ valid: boolean; message: string }> {
        const otpRecord = await this.otpRepository.findOne({
            where: {tenant_id: payload.tenant_id, otp: payload.otp},
        });

        if (!otpRecord) {
            throw new CustomHttpExceptionError("Invalid OTP code", 400);
        }

        if (otpRecord.status === 1) {
            throw new CustomHttpExceptionError("OTP already used", 400);
        }

        if (otpRecord.status === 2 || dayjs(otpRecord.expired_at).isBefore(dayjs())) {
            throw new CustomHttpExceptionError("OTP expired", 400);
        }

        // Mark OTP as used
        otpRecord.status = 1;
        await this.otpRepository.save(otpRecord);

        return {valid: true, message: "OTP verified successfully"};
    }
}