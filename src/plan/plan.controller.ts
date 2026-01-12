import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { PlanService, FoodItem } from "./plan.service";
import { OnboardingProfileDto } from "../onboarding/dto/submit-onboarding.dto";
import {
  ApiProperty,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { ValidateNested, IsNotEmpty, IsArray } from "class-validator";
import { Type } from "class-transformer";

class FoodItemDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  cal: number;
  @ApiProperty()
  protein_g: number;
  @ApiProperty()
  carbs_g: number;
  @ApiProperty()
  fat_g: number;
  @ApiProperty()
  tags: string[];
  @ApiProperty()
  mealTypesAllowed: string[];
  @ApiProperty()
  priceTier: "low" | "medium" | "premium";
  @ApiProperty({ required: false })
  prepTimeMin?: number;
  @ApiProperty({ required: false })
  allergen?: string[];
}

class GeneratePlanDto extends OnboardingProfileDto {
  @ApiProperty({ type: [FoodItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  catalog: FoodItemDto[];
}

@ApiTags("Plan")
@Controller("plan")
export class PlanController {
  constructor(private planService: PlanService) {}

  @Post("generate")
  @ApiOperation({ summary: "Generate a meal plan engine v1" })
  @ApiResponse({ status: 201, description: "Generated meal plan" })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  generate(@Body() body: GeneratePlanDto) {
    // Separate catalog from profile
    const { catalog, ...profile } = body;
    // Cast profile back to valid DTO structure if needed (runtime it works)
    return this.planService.generatePlan(profile as any, catalog as any);
  }
}
