import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
    Length,
    IsUUID,
} from "class-validator";

/**
 * ✅ DTO for creating a new tenant (and related tenant_data)
 */
export class CreateTenantRequest {
    @IsNotEmpty({message: "Organization ID cannot be empty"})
    @IsUUID("4", {message: "Invalid Organization ID format"})
    org_id: string;

    @IsNotEmpty({message: "Unit ID cannot be empty"})
    @IsUUID("4", {message: "Invalid Unit ID format"})
    unit_id: string;

    @IsOptional()
    @IsString({message: "Invalid email format"})
    @Length(0, 100, {message: "Email must be up to 100 characters"})
    email?: string;

    @IsOptional()
    @IsString({message: "Invalid phone number format"})
    @Length(0, 100, {message: "Phone must be up to 100 characters"})
    phone?: string;

    @IsOptional()
    @IsString({message: "Invalid Telegram ID format"})
    @Length(0, 100, {message: "Telegram ID must be up to 100 characters"})
    telegram_id?: string;

    @IsOptional()
    @IsString({message: "Invalid language format"})
    @Length(0, 10, {message: "Language code must be up to 10 characters"})
    lang?: string;

    @IsOptional()
    @IsString({message: "Invalid style format"})
    style?: string;

    @IsOptional()
    @IsInt({message: "Status must be an integer"})
    status?: number;

    // ✅ Tenant Data
    @IsOptional()
    @IsString({message: "Invalid first name format"})
    @Length(0, 100, {message: "First name must be up to 100 characters"})
    first_name?: string;

    @IsOptional()
    @IsString({message: "Invalid last name format"})
    @Length(0, 100, {message: "Last name must be up to 100 characters"})
    last_name?: string;

    @IsOptional()
    @IsString({message: "Invalid salutation format"})
    salutation?: string;
}

/**
 * ✅ DTO for updating an existing tenant (and related tenant_data)
 */
export class UpdateTenantRequest {
    @IsOptional()
    @IsString({message: "Invalid email format"})
    @Length(0, 100, {message: "Email must be up to 100 characters"})
    email?: string;

    @IsOptional()
    @IsString({message: "Invalid phone format"})
    @Length(0, 100, {message: "Phone must be up to 100 characters"})
    phone?: string;

    @IsOptional()
    @IsString({message: "Invalid Telegram ID format"})
    @Length(0, 100, {message: "Telegram ID must be up to 100 characters"})
    telegram_id?: string;

    @IsOptional()
    @IsString({message: "Invalid language format"})
    @Length(0, 10, {message: "Language code must be up to 10 characters"})
    lang?: string;

    @IsOptional()
    @IsString({message: "Invalid style format"})
    style?: string;

    @IsOptional()
    @IsInt({message: "Status must be an integer"})
    status?: number;

    // ✅ Tenant Data
    @IsOptional()
    @IsString({message: "Invalid first name format"})
    @Length(0, 100, {message: "First name must be up to 100 characters"})
    first_name?: string;

    @IsOptional()
    @IsString({message: "Invalid last name format"})
    @Length(0, 100, {message: "Last name must be up to 100 characters"})
    last_name?: string;

    @IsOptional()
    @IsString({message: "Invalid salutation format"})
    salutation?: string;
}