import {IsNotEmpty, IsString, IsEmail, IsOptional, Matches} from 'class-validator';

export class CreateOrganizationRequest {
    @IsNotEmpty({message: "Access token cannot be empty"})
    @IsString({message: "Access token must be a string"})
    authentik_accessToken: string;

    @IsNotEmpty({message: "User ID cannot be empty"})
    @IsString({message: "User ID must be a string"})
    authentik_userId: string;

    @IsNotEmpty({message: "User email cannot be empty"})
    @IsEmail({}, {message: "Invalid email format"})
    authentik_userEmail: string;

    @IsNotEmpty({message: "User name cannot be empty"})
    @IsString({message: "User name must be a string"})
    authentik_name: string;

    @IsOptional()
    @IsString({message: "Profile image path must be a string"})
    @Matches(
        /^(https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp|svg)$|[A-Za-z0-9_\-\/\.]+\.(jpg|jpeg|png|webp|svg))$/i,
        {message: "Profile must be a valid image URL or local path (jpg, jpeg, png, webp, svg)"}
    )
    authentik_profileImagePath?: string;
}

export class UpdateOrganizationRequest {
    @IsEmail({}, {message: "Invalid email format"})
    email?: string;

    @IsString({message: "Name must be a string"})
    name?: string;

    @IsOptional()
    @IsString({message: "Profile URL or path must be a string"})
    @Matches(
        /^(https?:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp|svg)$|[A-Za-z0-9_\-\/\.]+\.(jpg|jpeg|png|webp|svg))$/i,
        {message: "Profile must be a valid image URL or local path (jpg, jpeg, png, webp, svg)"}
    )
    profile?: string;

    @IsString({message: "Phone number must be a string"})
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: "Phone number must be a valid international format (E.164, e.g. +628123456789)",
    })
    phone?: string;
}
