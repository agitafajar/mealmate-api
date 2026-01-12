import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OnboardingStepEntity } from "../entities/onboarding-step.entity";
import { UserProfile } from "../entities/user-profile.entity";
import { OnboardingProfileDto } from "./dto/submit-onboarding.dto";

import { MacroService } from "../macro/macro.service";

const DISALLOWED_DIET_TAGS_BY_GOAL: Record<string, string[]> = {
  bulking: ["low_calorie"],
  cutting: [],
  maintain: [],
};

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingStepEntity)
    private stepRepo: Repository<OnboardingStepEntity>,
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>,
    private macroService: MacroService
  ) {}

  async getSteps(goal?: string) {
    const steps = await this.stepRepo.find({
      where: { isActive: true },
      order: { stepOrder: "ASC" },
    });

    if (!goal) return steps;

    // Filter logic
    return steps.map((s) => {
      // Logic specific for 'preferences' step which contains 'diet_tags'
      if (s.key === "preferences" && s.options && s.options.fields) {
        const newFields = s.options.fields.map((f: any) => {
          if (f.key === "diet_tags" && f.options) {
            const blockedTags =
              DISALLOWED_DIET_TAGS_BY_GOAL[goal.toLowerCase()] || [];
            if (blockedTags.length === 0) return f;

            const newOptions = f.options.filter(
              (opt: any) => !blockedTags.includes(opt.value)
            );
            return { ...f, options: newOptions };
          }
          return f;
        });
        return { ...s, options: { ...s.options, fields: newFields } };
      }
      return s;
    });
  }

  async submitProfile(userId: string, data: OnboardingProfileDto) {
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

    const savedProfile = await this.profileRepo.save(profile);
    const macroResult = this.macroService.calculateMacros(savedProfile);

    return {
      profile: savedProfile,
    };
  }
}
