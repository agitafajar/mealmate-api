import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserProfile } from "../entities/user-profile.entity";
import { SubmitOnboardingDto } from "../onboarding/dto/submit-onboarding.dto";

@Injectable()
export class MacroService {
  constructor(
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>
  ) {}

  calculateMacros(profile: Partial<UserProfile> | SubmitOnboardingDto) {
    // 1. Extract values, handling both DTO and Entity structures
    // Because mapped names in DTO might not be direct in raw object if not transformed,
    // we assume the caller passes a standard object that looks like the Entity or mapped DTO.
    // Ideally, we normalize input. For this simplicity, we rely on the DTO->Entity mapping logic.
    const p = profile as any;

    // Normalize properties
    const weight = p.weight || p.weight_kg;
    const height = p.height || p.height_cm;
    const age = p.age;
    const gender = p.gender; // "male" | "female"
    const activityLevelRaw = p.activityLevel || p.activity_level;
    const goalRaw = p.goal;

    if (!weight || !height || !age || !gender) {
      // Return zeros if basic data is missing
      return null;
    }

    // 1. Calculate BMR using Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // 2. TDEE Multiplier
    let activityMultiplier = 1.2;
    const activityLevel = activityLevelRaw?.toLowerCase() || "sedentary";

    if (activityLevel.includes("sedentary") || activityLevel.includes("kantor"))
      activityMultiplier = 1.2;
    else if (activityLevel.includes("light") || activityLevel.includes("low"))
      activityMultiplier = 1.375;
    else if (
      activityLevel.includes("moderate") ||
      activityLevel.includes("medium")
    )
      activityMultiplier = 1.55;
    else if (activityLevel.includes("active") || activityLevel.includes("high"))
      activityMultiplier = 1.725;

    const tdee = bmr * activityMultiplier;

    // 3. Goal Adjustment
    let targetCalories = tdee;
    let goalLabel = "Maintain Weight";
    let surplus = 0;
    const goal = goalRaw?.toLowerCase() || "maintain";

    if (
      goal.includes("lose") ||
      goal.includes("turun") ||
      goal.includes("cut")
    ) {
      surplus = -500;
      targetCalories = tdee - 500;
      goalLabel = "Defisit -500 kkal";
    } else if (
      goal.includes("gain") ||
      goal.includes("naik") ||
      goal.includes("bulk")
    ) {
      surplus = 350;
      targetCalories = tdee + 350;
      goalLabel = "Surplus +350 kkal";
    }

    // Round calories to nearest 10
    targetCalories = Math.round(targetCalories / 10) * 10;

    // 4. Macro Splits (Standard Balanced Diet: 25% P, 50% C, 25% F)
    const proteinCals = targetCalories * 0.25;
    const carbCals = targetCalories * 0.5;
    const fatCals = targetCalories * 0.25;

    const proteinGrams = Math.round(proteinCals / 4);
    const carbGrams = Math.round(carbCals / 4);
    const fatGrams = Math.round(fatCals / 9);

    // 5. Tips based on profile
    let tipTitle = "Tips Umum";
    let tipDescription =
      "Minum air 8 gelas sehari untuk metabolisme yang baik.";

    if (activityLevel.includes("kantor") || activityLevel.includes("office")) {
      tipTitle = "Tips Kantor";
      tipDescription =
        "Siapkan camilan tinggi protein (seperti kacang atau yogurt) di meja kerja Anda untuk mencapai target protein dengan mudah.";
    }

    return {
      targetCalories,
      goalLabel,
      surplusOrDeficit: surplus > 0 ? `+${surplus}` : `${surplus}`,
      macros: {
        protein: { grams: proteinGrams, percentage: 25 },
        carbs: { grams: carbGrams, percentage: 50 },
        fats: { grams: fatGrams, percentage: 25 },
      },
      estimation: {
        weeks: 12,
        message: "Mencapai target dalam 12 Minggu",
      },
      tip: {
        title: tipTitle,
        description: tipDescription,
      },
    };
  }

  async getResult(userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return this.calculateMacros(profile);
  }
}
