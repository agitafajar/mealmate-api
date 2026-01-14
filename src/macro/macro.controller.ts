import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { MacroService } from "./macro.service";
import { OnboardingProfileDto } from "../onboarding/dto/submit-onboarding.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Macro")
@Controller("macro")
export class MacroController {
  constructor(private macroService: MacroService) {}

  @Post("preview")
  @ApiOperation({ summary: "Preview macro calculation without saving" })
  @ApiResponse({ status: 201, description: "Macro calculation result" })
  @ApiResponse({ status: 400, description: "Invalid profile data" })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  preview(@Body() body: OnboardingProfileDto) {
    // For preview, we directly calculate based on the body provided
    return this.macroService.calculateMacros(body);
  }

  @Get("result")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get saved macro result for user" })
  @ApiResponse({ status: 200, description: "Saved macro result" })
  @ApiResponse({ status: 404, description: "Profile not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getResult(@Req() req) {
    const userId = req.user.userId;
    return this.macroService.getResult(userId);
  }

  @Post("result")
  @ApiOperation({ summary: "Calculate macro result based on payload" })
  @ApiResponse({ status: 201, description: "Macro calculation result" })
  @ApiResponse({ status: 400, description: "Invalid profile data" })
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  postResult(@Body() body: OnboardingProfileDto) {
    return this.macroService.calculateMacros(body);
  }
}
