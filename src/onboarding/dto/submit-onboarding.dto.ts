import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Expose } from "class-transformer";
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from "class-validator";

class PreferencesDto {
  @ApiProperty({
    name: "protein_sources",
    example: ["Ayam", "Sapi", "Ikan", "Telur"],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose({ name: "protein_sources" })
  proteinSources?: string[];

  @ApiProperty({ name: "budget_tier", example: "medium" })
  @IsString()
  @IsOptional()
  @Expose({ name: "budget_tier" })
  budgetTier?: string;

  @ApiProperty({ name: "diet_tags", example: ["high_protein", "low_calorie"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose({ name: "diet_tags" })
  dietTags?: string[];
}

export class SubmitOnboardingDto {
  @ApiProperty({ example: "male" })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiProperty({ name: "height_cm", example: 170.0 })
  @IsNumber()
  @IsOptional()
  @Expose({ name: "height_cm" })
  height?: number;

  @ApiProperty({ name: "weight_kg", example: 60.0 })
  @IsNumber()
  @IsOptional()
  @Expose({ name: "weight_kg" })
  weight?: number;

  @ApiProperty({ name: "activity_level", example: "high" })
  @IsString()
  @IsOptional()
  @Expose({ name: "activity_level" })
  activityLevel?: string;

  @ApiProperty({ example: "bulking" })
  @IsString()
  @IsOptional()
  goal?: string;

  @ApiProperty({ type: PreferencesDto })
  @ValidateNested()
  @Type(() => PreferencesDto)
  @IsOptional()
  preferences?: PreferencesDto;

  @ApiProperty({ name: "is_shift_worker", example: false })
  @IsBoolean()
  @IsOptional()
  @Expose({ name: "is_shift_worker" })
  isShiftWorker?: boolean;

  @ApiProperty({ name: "work_start_time", example: "09:00" })
  @IsString()
  @IsOptional()
  @Expose({ name: "work_start_time" })
  workStartTime?: string;

  @ApiProperty({ name: "work_end_time", example: "17:00" })
  @IsString()
  @IsOptional()
  @Expose({ name: "work_end_time" })
  workEndTime?: string;

  @ApiProperty({ name: "workout_time", example: "17:00" })
  @IsString()
  @IsOptional()
  @Expose({ name: "workout_time" })
  workoutTime?: string;

  @ApiProperty({ name: "has_office_catering", example: true })
  @IsBoolean()
  @IsOptional()
  @Expose({ name: "has_office_catering" })
  hasOfficeCatering?: boolean;
}
