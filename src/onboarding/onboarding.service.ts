import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OnboardingStepEntity } from "../entities/onboarding-step.entity";
import { UserProfile } from "../entities/user-profile.entity";
import { SubmitOnboardingDto } from "./dto/submit-onboarding.dto";

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingStepEntity)
    private stepRepo: Repository<OnboardingStepEntity>,
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>
  ) {}

  async getSteps() {
    return this.stepRepo.find({
      where: { isActive: true },
      order: { stepOrder: "ASC" },
    });
  }

  async submitProfile(userId: string, data: SubmitOnboardingDto) {
    let profile = await this.profileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.profileRepo.create({
        userId,
        ...data,
      });
    } else {
      this.profileRepo.merge(profile, data);
    }

    return this.profileRepo.save(profile);
  }
}
