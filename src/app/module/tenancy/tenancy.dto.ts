import {
    IsNotEmpty,
    IsString,
} from 'class-validator';

export class CreateFaqRequest {
    @IsNotEmpty({message: "Faq question cannot be empty"})
    @IsString({message: "Invalid property question"})
    faq: string;

    @IsNotEmpty({message: "Faq answer cannot be empty"})
    @IsString({message: "Invalid property answer"})
    answer: string;

    @IsNotEmpty({message: "Faq category cannot be empty"})
    @IsString({message: "Invalid property category"})
    faq_category_id: string;
}

export class UpdateFaqRequest {
    @IsNotEmpty({message: "Faq question cannot be empty"})
    @IsString({message: "Invalid property question"})
    faq: string;

    @IsNotEmpty({message: "Faq answer cannot be empty"})
    @IsString({message: "Invalid property answer"})
    answer: string;

    @IsNotEmpty({message: "Faq category cannot be empty"})
    @IsString({message: "Invalid property category"})
    faq_category_id: string;
}