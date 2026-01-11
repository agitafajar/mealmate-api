import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { PlanModule } from "./plan/plan.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { MacroModule } from "./macro/macro.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    OnboardingModule,
    PlanModule,
    DashboardModule,
    MacroModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
