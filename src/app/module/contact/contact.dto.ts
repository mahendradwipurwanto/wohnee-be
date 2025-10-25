import {
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
} from "class-validator";

export class CreateContactRequest {
    @IsNotEmpty({message: "Unit ID cannot be empty"})
    @IsString({message: "Invalid unit ID format"})
    unit_id: string;

    @IsNotEmpty({message: "Contact person cannot be empty"})
    @IsString({message: "Invalid contact person"})
    @Length(1, 100, {message: "Contact person must be between 1 and 100 characters"})
    contact_person: string;

    @IsOptional()
    @IsString({message: "Invalid company name"})
    @Length(0, 100, {message: "Company name must be up to 100 characters"})
    company?: string;

    @IsNotEmpty({message: "Type cannot be empty"})
    @IsString({message: "Invalid contact type"})
    @Length(1, 15, {message: "Type must be between 1 and 15 characters"})
    type: string;

    @IsNotEmpty({message: "Value cannot be empty"})
    @IsString({message: "Invalid contact value"})
    @Length(1, 50, {message: "Value must be between 1 and 50 characters"})
    value: string;

    @IsOptional()
    @IsString({message: "Invalid role format"})
    role?: string;

    @IsOptional()
    @IsString({message: "Invalid craft format"})
    craft?: string;
}

export class UpdateContactRequest {
    @IsOptional()
    @IsString({message: "Invalid contact person"})
    @Length(1, 100)
    contact_person?: string;

    @IsOptional()
    @IsString({message: "Invalid company name"})
    @Length(0, 100)
    company?: string;

    @IsOptional()
    @IsString({message: "Invalid contact type"})
    @Length(1, 15)
    type?: string;

    @IsOptional()
    @IsString({message: "Invalid contact value"})
    @Length(1, 50)
    value?: string;

    @IsOptional()
    @IsString({message: "Invalid role format"})
    role?: string;

    @IsOptional()
    @IsString({message: "Invalid craft format"})
    craft?: string;
}