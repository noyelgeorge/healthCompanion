import { useAppStore, type MealEntry, type UserProfile } from "../store/useAppStore"

// We'll use the Gemini 2.0 Flash API via REST to avoid package installation issues
// Pin model version to avoid breaking changes
const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`

/**
 * Robust fetch wrapper with exponential backoff retry logic.
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2): Promise<Response> {
    let lastError: unknown;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(url, options);

            // Success OR client error (4xx) that shouldn't be retried
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return response;
            }

            throw new Error(`Server returned ${response.status}`);
        } catch (err) {
            lastError = err;
            if (i < maxRetries) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error("Fetch failed after retries");
}

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

const sanitizeJSON = (text: string) => {
    try {
        // First try to find a JSON block between backticks
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match && match[1]) {
            return match[1].trim();
        }

        // If no backticks, find the first balance of brackets/braces
        const firstBracket = text.indexOf('[');
        const firstBrace = text.indexOf('{');
        let start = -1;
        if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) start = firstBracket;
        else if (firstBrace !== -1) start = firstBrace;

        if (start !== -1) {
            const lastBracket = text.lastIndexOf(']');
            const lastBrace = text.lastIndexOf('}');
            let end = -1;
            if (lastBracket !== -1 && (lastBrace === -1 || lastBracket > lastBrace)) end = lastBracket;
            else if (lastBrace !== -1) end = lastBrace;

            if (end !== -1 && end > start) {
                return text.substring(start, end + 1).trim();
            }
        }

        return text.trim();
    } catch {
        return text.trim();
    }
};

/**
 * Unified helper to retrieve the Gemini API Key.
 * Priority: 1. User's custom key (Profile) -> 2. Environment Variable -> 3. Shared App Key
 * Returns null if no key is configured anywhere.
 */
export const getApiKey = () => {
    const state = useAppStore.getState();
    const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    return state.apiKey || envKey || state.sharedApiKey || null;
};

export async function analyzeImage(file: File): Promise<Omit<MealEntry, 'id' | 'timestamp' | 'mealType'>> {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error(
            "No Gemini API key configured. Go to Profile → AI Settings to add your key."
        )
    }

    try {
        const base64Image = await fileToBase64(file);

        const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `IDENTIFY: Precisely name all food items in the image.
                        ESTIMATE: Total calories, protein, carbs, and fat (grams).
                        ANALYZE: Assign a 'healthScore' (1-10) based on nutritional density and typical ingredients.
                        EXPLAIN: Provide a 1-sentence 'reasoning' for the score.
                        
                        Return ONLY JSON:
                        {
                          "name": "Detailed name of meal",
                          "calories": number,
                          "protein": number,
                          "carbs": number,
                          "fat": number,
                          "healthScore": number,
                          "reasoning": "Your brief explanation",
                          "ingredients": ["string", "string"]
                        }`
                        },
                        {
                            inline_data: {
                                mime_type: file.type,
                                data: base64Image
                            }
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(
                errData?.error?.message ||
                `Gemini API error ${response.status}. Check your API key in Profile settings.`
            )
        }

        const result = await response.json();

        if (!result.candidates || result.candidates.length === 0) {
            throw new Error("Gemini returned no results. The image might be unclear or unsupported.");
        }

        const content = result.candidates[0].content.parts[0].text;
        const data = JSON.parse(sanitizeJSON(content));

        return {
            name: data.name || "Unknown Food",
            calories: Math.round(data.calories || 0),
            protein: Math.round(data.protein || 0),
            carbs: Math.round(data.carbs || 0),
            fat: Math.round(data.fat || 0),
            healthScore: data.healthScore || 5,
            reasoning: data.reasoning || "Balanced meal.",
            ingredients: data.ingredients || []
        };

    } catch (error) {
        console.error("Gemini Scan failed:", error);
        throw error;
    }
}



export async function getAIHealthInsights(weeklyData: unknown[], userProfile: UserProfile): Promise<{ wins: string, watchOut: string, focusThisWeek: string } | string> {
    const apiKey = getApiKey();
    if (!apiKey) return "Log your meals daily to unlock personalized AI health insights and coaching.";

    try {
        const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Act as a professional nutritionist. Analyze this user's weekly health data:
                        Weekly Data: ${JSON.stringify(weeklyData)}
                        User Goal: ${userProfile.goal}
                        
                        Return ONLY a JSON object with exactly these fields:
                        {
                          "wins": "One positive thing the user did this week (1 short sentence)",
                          "watchOut": "One potential issue or area for improvement (1 short sentence)",
                          "focusThisWeek": "One specific actionable goal for next week (1 short sentence)"
                        }`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `API call failed: ${response.status}`);
        }
        const result = await response.json();

        if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error("AI returned no insights. Please try again later.");
        }

        const content = result.candidates[0].content.parts[0].text;
        return JSON.parse(sanitizeJSON(content));
    } catch (e) {
        console.error("Health insights failed:", e);
        // Rethrow if it's an explicit error we want the user to see (like quota)
        if (e instanceof Error && (e.message.includes("Quota") || e.message.includes("API key"))) {
            throw e;
        }
        return {
            wins: "You're consistently tracking your progress—that's the first step!",
            watchOut: "Watch your weekend calorie intake to stay on track.",
            focusThisWeek: "Aim for more protein in your breakfast next week."
        };
    }
}

export async function generateMealPlan(userProfile: UserProfile, availableIngredients?: string): Promise<Omit<MealEntry, 'id' | 'timestamp'>[]> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("AI features require a configured API key in Profile.");

    try {
        const ingredientsContext = availableIngredients
            ? `IMPORTANT: The user has these ingredients available: ${availableIngredients}. Prioritize using these in the meals.`
            : "Generate a diverse and nutritionally balanced plan.";

        const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Act as a professional meal planner. ${ingredientsContext}
                        User Stats: Goal: ${userProfile.goal}, Height: ${userProfile.height}cm, Weight: ${userProfile.weight}kg, Age: ${userProfile.age}.
                        IMPORTANT: Every meal object MUST include a non-empty "ingredients" array. Provide a COMPREHENSIVE and DETAILED list of every specific ingredient and quantity (e.g., '2 Large Eggs', '100g Baby Spinach').
                        Structure: [{"mealType": "breakfast"|"lunch"|"dinner"|"snack", "name": "meal name", "calories": number, "protein": number, "carbs": number, "fat": number, "ingredients": ["string"]}]`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(
                errData?.error?.message ||
                `AI generation failed: ${response.status}. Check your API key in Profile settings.`
            )
        }

        const result = await response.json();
        if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error("AI returned empty content");
        }

        const content = result.candidates[0].content.parts[0].text;
        const sanitized = sanitizeJSON(content);
        let meals;
        try {
            meals = JSON.parse(sanitized);
        } catch (e) {
            console.error("AI JSON Parse Error:", e, "Raw:", content);
            throw new Error("AI returned unreadable data. Please try again.");
        }

        // Defensive validation: ensure ingredients exists for all meals
        return (Array.isArray(meals) ? meals : []).map((m: Record<string, unknown>) => ({
            mealType: 'snack' as const, // Default, logic should override
            name: 'Unknown Item',
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            ...m,
            ingredients: Array.isArray(m.ingredients) ? m.ingredients : []
        })) as Omit<MealEntry, 'id' | 'timestamp'>[];
    } catch (e) {
        console.error("Meal planning failed:", e);
        throw e;
    }
}

export async function testGeminiKey(apiKey: string): Promise<boolean> {
    if (!apiKey) return false;
    try {
        const response = await fetchWithRetry(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "hi" }] }]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `API Error: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error("Key validation failed:", error);
        throw error;
    }
}
