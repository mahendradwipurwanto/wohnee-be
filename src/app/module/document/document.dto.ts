import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
    Length,
    Min,
} from "class-validator";

export class CreateDocumentRequest {
    @IsNotEmpty({ message: "Unit ID cannot be empty" })
    @IsString({ message: "Invalid unit ID format" })
    unit_id: string;

    @IsNotEmpty({ message: "Title cannot be empty" })
    @IsString({ message: "Invalid title format" })
    @Length(1, 100, { message: "Title must be between 1 and 100 characters" })
    title: string;

    @IsOptional()
    @IsString({ message: "Invalid description format" })
    description?: string;

    @IsNotEmpty({ message: "Type cannot be empty" })
    @IsString({ message: "Invalid type format" })
    @Length(1, 25, { message: "Type must be between 1 and 25 characters" })
    type: string;

    @IsOptional()
    @IsInt({ message: "Analyze state must be a number" })
    @Min(0, { message: "Analyze state cannot be negative" })
    analyze_state?: number;

    @IsOptional()
    @IsString({ message: "Invalid file path format" })
    file_path?: string;
}

export class UpdateDocumentRequest {
    @IsOptional()
    @IsString({ message: "Invalid title format" })
    @Length(1, 100, { message: "Title must be between 1 and 100 characters" })
    title?: string;

    @IsOptional()
    @IsString({ message: "Invalid description format" })
    description?: string;

    @IsOptional()
    @IsString({ message: "Invalid type format" })
    @Length(1, 25, { message: "Type must be between 1 and 25 characters" })
    type?: string;

    @IsOptional()
    @IsInt({ message: "Analyze state must be a number" })
    analyze_state?: number;

    @IsOptional()
    @IsString({ message: "Invalid file path format" })
    file_path?: string;
}