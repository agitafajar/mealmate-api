import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { MacroService } from "./macro.service";
import { SubmitOnboardingDto } from "../onboarding/dto/submit-onboarding.dto";

@Controller("macro")
export class MacroController {
  constructor(private macroService: MacroService) {}

  @Post("preview")
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  preview(@Body() body: SubmitOnboardingDto) {
    // For preview, we directly calculate based on the body provided
    return this.macroService.calculateMacros(body);
  }

  @Get("result")
  async getResult() {
    // TODO: Get userId from Auth Guard
    const userId = "temp-user-id";
    return this.macroService.getResult(userId);
  }
}
