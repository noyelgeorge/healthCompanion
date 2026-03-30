import { type UserProfile } from "../store/useAppStore"

export function calculateBMR(user: UserProfile): number {
    // Mifflin-St Jeor Equation
    // Men: 10W + 6.25H - 5A + 5
    // Women: 10W + 6.25H - 5A - 161
    const s = user.gender === 'male' ? 5 : -161
    return (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + s
}

export function calculateTDEE(user: UserProfile): number {
    const bmr = calculateBMR(user)

    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        athlete: 1.9
    }

    // Default to moderate if not set
    const multiplier = activityMultipliers[user.activityLevel || 'moderate']
    const baseTdee = Math.round(bmr * multiplier)

    // Goal-based adjustment
    if (user.goal === 'lose') return Math.round(baseTdee * 0.80)
    if (user.goal === 'gain') return Math.round(baseTdee * 1.10)
    return baseTdee
}

export function calculateExerciseCalories(type: string, durationMinutes: number, userWeight: number): number {
    // MET (Metabolic Equivalent of Task) values
    const metValues: Record<string, number> = {
        walk: 3.5,
        run: 8.0,
        bike: 6.0,
        strength: 5.0,
        yoga: 2.5,
        other: 4.0
    }

    const met = metValues[type] || 4.0

    // Scientifically validated formula:
    // Calories = MET * 3.5 * weight_kg / 200 * duration_minutes
    return Math.round(met * 3.5 * userWeight / 200 * durationMinutes)
}

export interface MacroTargets {
    protein: number  // grams
    carbs: number    // grams
    fat: number      // grams
}

export function calculateMacroTargets(tdee: number): MacroTargets {
    return {
        protein: Math.round(tdee * 0.25 / 4),
        carbs: Math.round(tdee * 0.45 / 4),
        fat: Math.round(tdee * 0.30 / 9),
    }
}
