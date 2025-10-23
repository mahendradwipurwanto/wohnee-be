import {
    IsNotEmpty,
    IsString,
    IsEmail,
    IsOptional,
    Length,
    Matches,
} from "class-validator";

/**
 * DTO for Authentik-based Sign-In
 * Validates all required fields for secure login requests.
 */
export class SignInDto {
    @IsNotEmpty({message: "Access token is required"})
    @IsString({message: "Access token must be a string"})
    @Length(10, 1024, {message: "Access token length must be between 10 and 1024 characters"})
    authentik_accessToken!: string;

    @IsNotEmpty({message: "User ID is required"})
    @IsString({message: "User ID must be a string"})
    @Length(3, 128, {message: "User ID length must be between 3 and 128 characters"})
    authentik_userId!: string;

    @IsNotEmpty({message: "User email is required"})
    @IsEmail({}, {message: "Invalid email format"})
    authentik_userEmail!: string;

    @IsNotEmpty({message: "User name is required"})
    @IsString({message: "User name must be a string"})
    @Length(2, 100, {message: "User name must be between 2 and 100 characters long"})
    authentik_name!: string;

    @IsOptional()
    @IsString({message: "Profile image path must be a string"})
    @Matches(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i, {
        message: "Profile image path must be a valid image URL",
    })
    authentik_profileImagePath?: string;
}