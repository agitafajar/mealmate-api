import { Injectable } from "@nestjs/common";
import { OnboardingProfileDto } from "../onboarding/dto/submit-onboarding.dto";
import { MacroService } from "../macro/macro.service";

export interface FoodItem {
  id: string;
  name: string;
  cal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  tags: string[];
  mealTypesAllowed: string[];
  priceTier: "low" | "medium" | "premium";
  prepTimeMin?: number;
  allergen?: string[];
}

export interface MealTarget {
  cal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

@Injectable()
export class PlanService {
  constructor(private macroService: MacroService) {}

  generatePlan(profile: OnboardingProfileDto, catalog: FoodItem[]) {
    // 1. Get Macro Engine Result
    const macroResult = this.macroService.calculateMacros(profile);
    if (!macroResult) throw new Error("Invalid profile for macro calculation");

    const dayTargets = macroResult.dayTargets;
    const inputEcho = profile;

    // TASK B: Meal Distribution
    // Breakfast: 25%, Lunch: 35%, Dinner: 30%, Snack: 10%
    const mealRatios = {
      breakfast: 0.25,
      lunch: 0.35,
      dinner: 0.3,
      snack: 0.1,
    };

    // Calculate targets for each meal
    const mealTargets: Record<string, MealTarget> = {};
    for (const [mealType, ratio] of Object.entries(mealRatios)) {
      mealTargets[mealType] = {
        cal: dayTargets.cal * ratio,
        protein_g: dayTargets.protein_g * ratio,
        carbs_g: dayTargets.carbs_g * ratio,
        fat_g: dayTargets.fat_g * ratio,
      };
    }

    // TASK C: Hard Constraints
    // Filter catalog globally based on preferences (e.g. "no_pork")
    const dietTags = profile.preferences?.dietTags || [];
    const forbiddenTags: string[] = [];
    if (dietTags.includes("no_pork")) {
      forbiddenTags.push("pork", "babi", "non-halal");
    }

    const globalValidCatalog = catalog.filter((item) => {
      // Check forbidden tags
      const hasForbidden = item.tags.some((tag) =>
        forbiddenTags.includes(tag.toLowerCase())
      );
      if (hasForbidden) return false;
      return true;
    });

    // TASK D: Greedy Scoring
    const plan = [];
    let dayTotals = { cal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    const usedItemIds = new Set<string>(); // For repetition penalty

    // Extract profile settings for rules
    const hasCatering = profile.hasOfficeCatering === true;
    // Simple logic: if start/end times exist, assume work day
    const isWorkDay = !!(
      profile.workStartTime &&
      profile.workEndTime &&
      !profile.isShiftWorker
    );

    for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
      const target = mealTargets[mealType];

      // Filter by meal type allowed
      const mealCandidates = globalValidCatalog.filter((item) =>
        item.mealTypesAllowed.includes(mealType)
      );

      const items: any[] = [];
      let currentTotals = { cal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
      let remain = { ...target };
      let maxItems = 3;

      // -- 1. Office Catering Rule: Lunch Setup --
      const isLunchCatering = hasCatering && mealType === "lunch";

      // Weights logic
      let wCal = 0.25,
        wP = 0.35,
        wC = 0.25,
        wF = 0.15;
      if (isLunchCatering) {
        // Rule: increase protein priority slightly for catered lunch
        wP = 0.4;
        wCal = 0.2;
        wC = 0.25;
        wF = 0.15;
      }

      while (remain.cal > 80 && items.length < maxItems) {
        // Find best item
        let bestItem = null;
        let bestScore = Infinity;

        // Determine largest relative deficit for stabilizer bonus
        let largestDeficitType: "protein" | "carbs" | "fat" | null = null;
        if (isLunchCatering) {
          const defP = remain.protein_g / target.protein_g;
          const defC = remain.carbs_g / target.carbs_g;
          // const defF = remain.fat_g / target.fat_g; // fat usually managed by others
          if (defP > defC && defP > 0.5) largestDeficitType = "protein";
          else if (defC > defP && defC > 0.5) largestDeficitType = "carbs";
        }

        for (const item of mealCandidates) {
          // Normalization factors (approximate target or 1 to avoid div0)
          const dCal =
            Math.abs(remain.cal - item.cal) / Math.max(1, target.cal);
          const dP =
            Math.abs(remain.protein_g - item.protein_g) /
            Math.max(1, target.protein_g);
          const dC =
            Math.abs(remain.carbs_g - item.carbs_g) /
            Math.max(1, target.carbs_g);
          const dF =
            Math.abs(remain.fat_g - item.fat_g) / Math.max(1, target.fat_g);

          // Weights
          const baseScore = wCal * dCal + wP * dP + wC * dC + wF * dF;

          let penalties = 0;
          let bonuses = 0;

          // -- Rule: Forbidden tags --
          // (Already filtered in globalValidCatalog, but individual logic stays simplified)

          // -- Rule: Budget Penalty --
          const userBudget = profile.preferences?.budgetTier || "medium";
          let budgetPenalty = 0;
          if (userBudget === "medium" && item.priceTier === "premium")
            budgetPenalty = 0.15;
          if (userBudget === "low" && item.priceTier === "premium")
            budgetPenalty = 0.3;

          if (isLunchCatering) {
            // Rule: reduce budget penalty by 50%
            budgetPenalty = budgetPenalty * 0.5;
          }
          penalties += budgetPenalty;

          // -- Rule: Repetition penalty --
          if (usedItemIds.has(item.id)) penalties += 0.5;

          // -- Rule: Weekday Realism (Prep Time) --
          const prep = item.prepTimeMin || 0;
          if (isWorkDay) {
            if (mealType === "breakfast" && prep > 15) penalties += 0.5; // Strong penalty
            if (mealType === "dinner" && prep > 35) penalties += 0.25; // Mild penalty
            if (mealType === "snack" && prep > 5) penalties += 0.2; // Prefer quick snacks
          }
          if (isLunchCatering) {
            // Rule: Ignore prepTime penalty for lunch if catering
            // (Logic: we just didn't add it above, or if we did, we would reset it.
            // Since we conditionally apply based on mealType, we simply don't apply prep penalty if lunch is catered
            // effectively by not having a 'lunch' condition in the block above for prep penalty,
            // except general prep logic if any. The above block covers B/D/S specifically.)
          }

          // -- Bonuses --

          // Protein source bonus
          const preferredProt = profile.preferences?.proteinSources || [];
          const itemHasPreferred = preferredProt.some((p) =>
            item.tags.includes(p.toLowerCase())
          );
          if (itemHasPreferred) bonuses += 0.05;

          // Catering Tag Bonus
          if (isLunchCatering) {
            const cateringTags = [
              "office_catering",
              "canteen",
              "warteg",
              "mealbox",
            ];
            if (item.tags.some((t) => cateringTags.includes(t)))
              bonuses += 0.08;

            // Stabilizer Bonus
            if (largestDeficitType === "protein" && item.protein_g > 15)
              bonuses += 0.06;
            else if (largestDeficitType === "carbs" && item.carbs_g > 30)
              bonuses += 0.04;
          }

          const finalScore = baseScore + penalties - bonuses;

          if (finalScore < bestScore) {
            bestScore = finalScore;
            bestItem = item;
          }
        }

        if (bestItem) {
          items.push({ ...bestItem, servings: 1 });
          usedItemIds.add(bestItem.id);

          // Update remain
          remain.cal -= bestItem.cal;
          remain.protein_g -= bestItem.protein_g;
          remain.carbs_g -= bestItem.carbs_g;
          remain.fat_g -= bestItem.fat_g;

          // Update current meals
          currentTotals.cal += bestItem.cal;
          currentTotals.protein_g += bestItem.protein_g;
          currentTotals.carbs_g += bestItem.carbs_g;
          currentTotals.fat_g += bestItem.fat_g;
        } else {
          break;
        }
      }

      plan.push({
        mealType,
        items,
        mealTotals: currentTotals,
      });

      // Update day totals
      dayTotals.cal += currentTotals.cal;
      dayTotals.protein_g += currentTotals.protein_g;
      dayTotals.fat_g += currentTotals.fat_g;
    }

    // TASK E: Repair Pass
    const repairActions = [];
    const diff = {
      cal: dayTargets.cal - dayTotals.cal,
      protein_g: dayTargets.protein_g - dayTotals.protein_g,
      carbs_g: dayTargets.carbs_g - dayTotals.carbs_g,
      fat_g: dayTargets.fat_g - dayTotals.fat_g,
    };

    // 1. Deficit Repair
    if (Math.abs(diff.cal) > 150 || diff.protein_g > 10) {
      // Identify deficit type
      let type = "general";
      let searchTerm = [];
      if (diff.protein_g > 10) {
        type = "protein";
        searchTerm = ["tempe", "tahu", "egg", "chicken", "whey"];
      } else if (diff.carbs_g > 20) {
        type = "carbs";
        searchTerm = ["fruit", "bread", "rice", "pisang"];
      } else if (diff.fat_g > 10) {
        type = "fat";
        searchTerm = ["nuts", "avocado", "oil"];
      }

      // Try to find a snack adjuster
      // Simple logic: find item in catalog matching search term or just small snack
      const potentialAdjusters = globalValidCatalog.filter((i) => {
        if (i.mealTypesAllowed.includes("snack")) {
          if (type === "protein" && i.protein_g > 5) return true;
          if (type === "carbs" && i.carbs_g > 10) return true;
          if (type === "fat" && i.fat_g > 5) return true;
          if (type === "general" && i.cal < 200) return true;
        }
        return false;
      });

      if (potentialAdjusters.length > 0) {
        const adjuster = potentialAdjusters[0]; // Naive pick first
        // Add to snack
        const snackMeal = plan.find((p) => p.mealType === "snack");
        if (snackMeal) {
          snackMeal.items.push({ ...adjuster, servings: 1, isAdjuster: true });
          snackMeal.mealTotals.cal += adjuster.cal;
          snackMeal.mealTotals.protein_g += adjuster.protein_g;
          snackMeal.mealTotals.carbs_g += adjuster.carbs_g;
          snackMeal.mealTotals.fat_g += adjuster.fat_g;

          // Update totals
          dayTotals.cal += adjuster.cal;
          dayTotals.protein_g += adjuster.protein_g;
          dayTotals.carbs_g += adjuster.carbs_g;
          dayTotals.fat_g += adjuster.fat_g;

          repairActions.push({
            type: "add_adjuster",
            details: `Added ${adjuster.name} to snack for ${type} deficit`,
          });
        }
      }
    }

    // 2. Fat Excess Repair (Optimization)
    if (dayTotals.fat_g > dayTargets.fat_g + 10) {
      // Find high fat item
      let worstItem = null;
      let worstMealIndex = -1;
      let worstItemIndex = -1;

      plan.forEach((meal, mIdx) => {
        meal.items.forEach((item, iIdx) => {
          if (item.fat_g > 10) {
            // arbitrary high fat threshold
            if (!worstItem || item.fat_g > worstItem.fat_g) {
              worstItem = item;
              worstMealIndex = mIdx;
              worstItemIndex = iIdx;
            }
          }
        });
      });

      if (worstItem) {
        const alternative = globalValidCatalog.find(
          (i) =>
            i.mealTypesAllowed.includes(plan[worstMealIndex].mealType) &&
            i.fat_g < worstItem.fat_g &&
            Math.abs(i.protein_g - worstItem.protein_g) < 10 && // similar protein
            i.id !== worstItem.id
        );

        if (alternative) {
          // Swap
          const oldItem = plan[worstMealIndex].items[worstItemIndex];
          plan[worstMealIndex].items[worstItemIndex] = {
            ...alternative,
            servings: 1,
          };

          // Recalculate totals (naive update)
          const diffCal = alternative.cal - oldItem.cal;
          const diffP = alternative.protein_g - oldItem.protein_g;
          const diffC = alternative.carbs_g - oldItem.carbs_g;
          const diffF = alternative.fat_g - oldItem.fat_g;

          plan[worstMealIndex].mealTotals.cal += diffCal;
          plan[worstMealIndex].mealTotals.protein_g += diffP;
          plan[worstMealIndex].mealTotals.carbs_g += diffC;
          plan[worstMealIndex].mealTotals.fat_g += diffF;

          dayTotals.cal += diffCal;
          dayTotals.protein_g += diffP;
          dayTotals.carbs_g += diffC;
          dayTotals.fat_g += diffF;

          repairActions.push({
            type: "swap",
            details: `Swapped ${oldItem.name} for ${alternative.name} to reduce fat`,
          });
        }
      }
    }

    // Recalculate final diff
    const finalDiff = {
      cal: dayTargets.cal - dayTotals.cal,
      protein_g: dayTargets.protein_g - dayTotals.protein_g,
      carbs_g: dayTargets.carbs_g - dayTotals.carbs_g,
      fat_g: dayTargets.fat_g - dayTotals.fat_g,
    };

    return {
      inputEcho,
      macroEngine: {
        ...macroResult,
        mealTargets,
      },
      plan,
      dayTotals,
      diff: finalDiff,
      repairActions,
    };
  }
}
