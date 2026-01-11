import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { OnboardingService } from "./onboarding.service";
import { SubmitOnboardingDto } from "./dto/submit-onboarding.dto";

@Controller("onboarding")
export class OnboardingController {
  constructor(private onboarding: OnboardingService) {}

  @Get("steps")
  getSteps() {
    return this.onboarding.getSteps();
  }

  @Post("profile")
  @UsePipes(new ValidationPipe({ whitelist: true }))
  submitProfile(@Body() body: SubmitOnboardingDto) {
    const userId = "temp-user-id";
    return this.onboarding.submitProfile(userId, body);
  }
}
