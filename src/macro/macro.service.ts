import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserProfile } from "../entities/user-profile.entity";
import { OnboardingProfileDto } from "../onboarding/dto/submit-onboarding.dto";

@Injectable()
export class MacroService {
  constructor(
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>
  ) {}

  calculateMacros(profile: Partial<UserProfile> | OnboardingProfileDto) {
    // 1. Extract values
    const p = profile as any;

    const weight = p.weight || p.weight_kg;
    const height = p.height || p.height_cm;
    const age = p.age;
    const gender = p.gender; // "male" | "female"
    const activityLevelRaw = p.activityLevel || p.activity_level;
    const goalRaw = p.goal;

    if (!weight || !height || !age || !gender) {
      return null;
    }

    // 1. Calculate BMR using Mifflin-St Jeor Equation
    let bmr = 0;
    if (gender === "male") {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // 2. TDEE Multiplier (Antigravity v1 Map)
    // very_low: 1.2, low: 1.375, medium: 1.55, high: 1.725
    let activityMultiplier = 1.2;
    const activityLevel = activityLevelRaw?.toLowerCase() || "very_low";

    if (
      activityLevel.includes("very_low") ||
      activityLevel.includes("sedentary")
    )
      activityMultiplier = 1.2;
    else if (activityLevel.includes("low") || activityLevel.includes("light"))
      activityMultiplier = 1.375;
    else if (
      activityLevel.includes("medium") ||
      activityLevel.includes("moderate")
    )
      activityMultiplier = 1.55;
    else if (activityLevel.includes("high") || activityLevel.includes("active"))
      activityMultiplier = 1.725;

    const tdee = bmr * activityMultiplier;

    // 3. Goal Adjustment
    // bulking: +350, cutting: -500, maintain: 0
    let goalOffset = 0;
    let goalLabel = "Maintain Weight";
    const goal = goalRaw?.toLowerCase() || "maintain";

    if (goal.includes("bulking") || goal.includes("gain")) {
      goalOffset = 350;
      goalLabel = "Surplus +350 kkal";
    } else if (goal.includes("cutting") || goal.includes("lose")) {
      goalOffset = -500;
      goalLabel = "Defisit -500 kkal";
    }

    // 5. Target Calories
    let targetCal = tdee + goalOffset;

    // 6. Safety Clamp
    // min 1200
    if (targetCal < 1200) targetCal = 1200;
    // max deficit constraint: targetCal >= tdee - 800
    if (targetCal < tdee - 800) targetCal = tdee - 800;

    // Round to nearest 10
    targetCal = Math.round(targetCal / 10) * 10;

    // 7. Macro Split Preset v1 = 25/50/25
    const proteinKcal = targetCal * 0.25;
    const carbsKcal = targetCal * 0.5;
    const fatKcal = targetCal * 0.25;

    let proteinG = proteinKcal / 4;
    const carbsG = carbsKcal / 4;
    const fatG = fatKcal / 9;

    // Optional: Enforce minimum protein (1.6 * weight)
    if (goal.includes("bulking") || goal.includes("cutting")) {
      const minProtein = 1.6 * weight;
      if (proteinG < minProtein) {
        proteinG = minProtein;
        // Recalculate calories ? - Requirement only says "protein_g = max(...)"
        // Usually we would adjust others, but spec implies just overriding Grams.
        // We will stick to the grammar of the spec.
      }
    }

    // Round macros
    const proteinGrams = Math.round(proteinG);
    const carbGrams = Math.round(carbsG);
    const fatGrams = Math.round(fatG);

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
      // Inputs for verification
      bmr,
      activityMultiplier,
      tdee,
      goalOffset,

      // Results
      targetCalories: targetCal, // Keeping API compat
      goalLabel,
      surplusOrDeficit: goalOffset > 0 ? `+${goalOffset}` : `${goalOffset}`,
      macros: {
        protein: { grams: proteinGrams, percentage: 25 },
        carbs: { grams: carbGrams, percentage: 50 },
        fats: { grams: fatGrams, percentage: 25 },
      },

      // Structure specific for Antigravity Engine
      dayTargets: {
        cal: targetCal,
        protein_g: proteinGrams,
        carbs_g: carbGrams,
        fat_g: fatGrams,
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
