import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserProfileDto {
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Full name is required' })
    @MinLength(3, { message: 'Full name must be at least 3 characters long' })
    fullName!: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    theme?: string;
}
