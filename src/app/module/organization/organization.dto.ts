import { IsNotEmpty, IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateOrganizationRequest {
    @IsNotEmpty({ message: "Access token cannot be empty" })
    @IsString({ message: "Access token must be a string" })
    authentik_accessToken: string;

    @IsNotEmpty({ message: "User ID cannot be empty" })
    @IsString({ message: "User ID must be a string" })
    authentik_userId: string;

    @IsNotEmpty({ message: "User email cannot be empty" })
    @IsEmail({}, { message: "Invalid email format" })
    authentik_userEmail: string;

    @IsNotEmpty({ message: "User name cannot be empty" })
    @IsString({ message: "User name must be a string" })
    authentik_name: string;

    @IsOptional()
    @IsString({ message: "Profile image path must be a string" })
    authentik_profileImagePath?: string;
}

export class UpdateOrganizationRequest {
    @IsNotEmpty({ message: "Access token cannot be empty" })
    @IsString({ message: "Access token must be a string" })
    authentik_accessToken: string;

    @IsNotEmpty({ message: "User ID cannot be empty" })
    @IsString({ message: "User ID must be a string" })
    authentik_userId: string;

    @IsNotEmpty({ message: "User email cannot be empty" })
    @IsEmail({}, { message: "Invalid email format" })
    authentik_userEmail: string;

    @IsNotEmpty({ message: "User name cannot be empty" })
    @IsString({ message: "User name must be a string" })
    authentik_name: string;

    @IsOptional()
    @IsString({ message: "Profile image path must be a string" })
    authentik_profileImagePath?: string;
}