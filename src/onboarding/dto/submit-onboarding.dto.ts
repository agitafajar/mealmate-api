import { IsNumber, IsOptional, IsString } from "class-validator";

export class SubmitOnboardingDto {
  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  activityLevel?: string;

  @IsString()
  @IsOptional()
  goal?: string;
}
