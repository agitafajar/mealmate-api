import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MacroService } from "./macro.service";
import { SubmitOnboardingDto } from "../onboarding/dto/submit-onboarding.dto";

@ApiTags("Macro")
@Controller("macro")
export class MacroController {
  constructor(private macroService: MacroService) {}

  @Post("preview")
  @ApiOperation({ summary: "Preview macro calculation without saving" })
  @ApiResponse({ status: 201, description: "Macro calculation result" })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  preview(@Body() body: SubmitOnboardingDto) {
    // For preview, we directly calculate based on the body provided
    return this.macroService.calculateMacros(body);
  }

  @Get("result")
  @ApiOperation({ summary: "Get saved macro result for user" })
  @ApiResponse({ status: 200, description: "Saved macro result" })
  async getResult() {
    // TODO: Get userId from Auth Guard
    const userId = "temp-user-id";
    return this.macroService.getResult(userId);
  }

  @Post("result")
  @ApiOperation({ summary: "Calculate macro result based on payload" })
  @ApiResponse({ status: 201, description: "Macro calculation result" })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  postResult(@Body() body: SubmitOnboardingDto) {
    return this.macroService.calculateMacros(body);
  }
}
