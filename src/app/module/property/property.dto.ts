import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
} from "class-validator";

export class CreatePropertyRequest {
    @IsNotEmpty({message: "Property name cannot be empty"})
    @IsString({message: "Invalid property name"})
    @Length(1, 100, {message: "Property name must be between 1 and 100 characters"})
    name: string;

    @IsNotEmpty({message: "Country ID cannot be empty"})
    @IsString({message: "Invalid country ID format"})
    country_id: string;

    @IsOptional()
    @IsString({message: "Invalid city format"})
    @Length(0, 100, {message: "City name must be up to 100 characters"})
    city?: string;

    @IsOptional()
    @IsString({message: "Invalid street format"})
    street?: string;

    @IsOptional()
    @IsString({message: "Invalid house number format"})
    housenumber?: string;

    @IsOptional()
    @IsString({message: "Invalid ZIP code format"})
    @Length(0, 25, {message: "ZIP code must be up to 25 characters"})
    zip_code?: string;
}

export class UpdatePropertyRequest {
    @IsOptional()
    @IsString({message: "Invalid organization ID format"})
    org_id?: string;

    @IsOptional()
    @IsString({message: "Invalid property name"})
    @Length(1, 100, {message: "Property name must be between 1 and 100 characters"})
    name?: string;

    @IsOptional()
    @IsString({message: "Invalid country ID format"})
    country_id?: string;

    @IsOptional()
    @IsString({message: "Invalid city format"})
    @Length(0, 100, {message: "City name must be up to 100 characters"})
    city?: string;

    @IsOptional()
    @IsString({message: "Invalid street format"})
    street?: string;

    @IsOptional()
    @IsString({message: "Invalid house number format"})
    housenumber?: string;

    @IsOptional()
    @IsString({message: "Invalid ZIP code format"})
    @Length(0, 25, {message: "ZIP code must be up to 25 characters"})
    zip_code?: string;
}