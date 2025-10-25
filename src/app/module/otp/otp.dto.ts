import {IsNotEmpty, IsString, Length, IsUUID} from "class-validator";

export class CreateOtpRequest {
    @IsUUID("4", {message: "Invalid tenant ID format"})
    @IsNotEmpty({message: "Tenant ID is required"})
    tenant_id: string;
}

export class VerifyOtpRequest {
    @IsUUID("4", {message: "Invalid tenant ID format"})
    @IsNotEmpty({message: "Tenant ID is required"})
    tenant_id: string;

    @IsString({message: "OTP must be a string"})
    @Length(4, 10, {message: "OTP must be between 4–10 digits"})
    otp: string;
}