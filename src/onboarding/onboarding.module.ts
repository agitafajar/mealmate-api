import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OnboardingStepEntity } from "../entities/onboarding-step.entity";
import { UserProfile } from "../entities/user-profile.entity";
import { UserEntity } from "../entities/user.entity";
import { OnboardingService } from "./onboarding.service";
import { OnboardingController } from "./onboarding.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([OnboardingStepEntity, UserProfile, UserEntity]),
  ],
  providers: [OnboardingService],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
