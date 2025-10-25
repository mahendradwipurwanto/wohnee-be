import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    IsInt,
    Min,
} from "class-validator";

export class CreateUnitRequest {
    @IsNotEmpty({message: "Property ID cannot be empty"})
    @IsString({message: "Invalid property ID format"})
    property_id: string;

    @IsNotEmpty({message: "Unit name cannot be empty"})
    @IsString({message: "Invalid unit name"})
    @Length(1, 100, {message: "Unit name must be between 1 and 100 characters"})
    name: string;

    @IsOptional()
    @IsInt({message: "Floor must be a valid number"})
    @Min(0, {message: "Floor cannot be negative"})
    floor?: number;

    @IsOptional()
    @IsInt({message: "Living area must be a valid number"})
    @Min(0, {message: "Living area cannot be negative"})
    living_area?: number;
}

export class UpdateUnitRequest {
    @IsOptional()
    @IsString({message: "Invalid property ID format"})
    property_id?: string;

    @IsOptional()
    @IsString({message: "Invalid unit name"})
    @Length(1, 100, {message: "Unit name must be between 1 and 100 characters"})
    name?: string;

    @IsOptional()
    @IsInt({message: "Floor must be a valid number"})
    @Min(0, {message: "Floor cannot be negative"})
    floor?: number;

    @IsOptional()
    @IsInt({message: "Living area must be a valid number"})
    @Min(0, {message: "Living area cannot be negative"})
    living_area?: number;
}