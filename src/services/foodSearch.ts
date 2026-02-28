import { useAppStore } from "../store/useAppStore"

export interface FoodSearchResult {
    name: string
    calories: number
    protein: number
    carbs: number
    fat: number
    servingSize?: string
}

export async function searchFood(query: string): Promise<FoodSearchResult[]> {
    if (!query.trim()) return []
    const usdaKey = useAppStore.getState().usdaApiKey || 'DEMO_KEY'
    try {
        const res = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${usdaKey}&pageSize=8`
        )

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            console.error("USDA API Error:", res.status, errData)
            return []
        }

        const data = await res.json()
        if (!data.foods || data.foods.length === 0) {
            console.warn("No foods found for query:", query)
            return []
        }

        return data.foods.map((f: any) => {
            const nutrients = f.foodNutrients || []
            const get = (names: string[]) => {
                const n = nutrients.find((n: any) =>
                    names.some(name => n.nutrientName?.toLowerCase().includes(name.toLowerCase()))
                )
                return n?.value || 0
            }

            return {
                name: f.description,
                calories: Math.round(get(['energy', 'kcal'])),
                protein: Math.round(get(['protein']) * 10) / 10,
                carbs: Math.round(get(['carbohydrate']) * 10) / 10,
                fat: Math.round(get(['total lipid', 'fat']) * 10) / 10,
                servingSize: '100g'
            }
        }).filter((f: FoodSearchResult) => f.calories > 0)
    } catch (error) {
        console.error("Search fetch failed:", error)
        return []
    }
}
