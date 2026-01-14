import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { OnboardingService } from "./onboarding.service";
import { OnboardingProfileDto } from "./dto/submit-onboarding.dto";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";

@ApiTags("Onboarding")
@Controller("onboarding")
export class OnboardingController {
  constructor(private onboarding: OnboardingService) {}

  @Get("steps")
  @ApiOperation({ summary: "Get dynamic onboarding steps" })
  @ApiResponse({ status: 200, description: "Return list of onboarding steps" })
  @ApiQuery({
    name: "goal",
    required: false,
    description: "Filter options by goal (e.g. bulking, cutting)",
  })
  getSteps(@Query("goal") goal?: string) {
    return this.onboarding.getSteps(goal);
  }

  @Post("profile")
  @ApiOperation({ summary: "Submit or update user profile" })
  @ApiResponse({ status: 201, description: "Profile saved successfully" })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  submit(@Body() dto: OnboardingProfileDto) {
    const userId = "temp-user-id";
    return this.onboarding.submitProfile(userId, dto);
  }
}
