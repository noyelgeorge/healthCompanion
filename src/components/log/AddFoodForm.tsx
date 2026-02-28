
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { useAppStore, type MealEntry } from "../../store/useAppStore"
import { type RecipeBookItem } from "../../services/social"

import { X, Check, BookOpen, PenTool, Brain } from "lucide-react"
import { cn } from "../../lib/utils"

interface AddFoodFormProps {
    mealType: MealEntry['mealType']
    initialValues?: Partial<MealEntry>
    onClose: () => void
    onSubmit: (entry: Omit<MealEntry, 'id' | 'timestamp'> & { id?: string }) => void
}

export function AddFoodForm({ mealType, initialValues, onClose, onSubmit }: AddFoodFormProps) {
    const [mode, setMode] = useState<'manual' | 'recipe'>('manual')

    // REAL STORE CONNECTION (Safe Selectors)
    const recipeBook = useAppStore(state => state.recipeBook || [])
    const loadRecipeBook = useAppStore(state => state.loadRecipeBook)


    const [name, setName] = useState(initialValues?.name || "")
    const [calories, setCalories] = useState(initialValues?.calories?.toString() || "")
    const [protein, setProtein] = useState(initialValues?.protein?.toString() || "")
    const [carbs, setCarbs] = useState(initialValues?.carbs?.toString() || "")
    const [fat, setFat] = useState(initialValues?.fat?.toString() || "")
    const [caloriesManuallyEdited, setCaloriesManuallyEdited] = useState(!!initialValues?.calories)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (!caloriesManuallyEdited) {
            const p = Number(protein) || 0
            const c = Number(carbs) || 0
            const f = Number(fat) || 0
            if (p > 0 || c > 0 || f > 0) {
                const calculated = Math.round((p * 4) + (c * 4) + (f * 9))
                setCalories(String(calculated))
            }
        }
    }, [protein, carbs, fat, caloriesManuallyEdited])

    useEffect(() => {
        if (mode === 'recipe') {
            loadRecipeBook()
        }
    }, [mode, loadRecipeBook])

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!name.trim()) newErrors.name = "Name is required"

        const cals = Number(calories)
        if (!calories || isNaN(cals) || cals <= 0) newErrors.calories = "Must be > 0"

        const p = Number(protein)
        if (protein && (isNaN(p) || p < 0)) newErrors.protein = "Invalid"

        const c = Number(carbs)
        if (carbs && (isNaN(c) || c < 0)) newErrors.carbs = "Invalid"

        const f = Number(fat)
        if (fat && (isNaN(f) || f < 0)) newErrors.fat = "Invalid"

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        onSubmit({
            id: (initialValues as MealEntry)?.id,
            mealType,
            name: name.trim(),
            calories: Number(calories),
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fat: Number(fat) || 0,
            healthScore: initialValues?.healthScore,
            reasoning: initialValues?.reasoning,
            ingredients: []
        })

        onClose()
    }

    const handleRecipeSelect = (recipe: RecipeBookItem) => {
        onSubmit({
            mealType,
            name: recipe.name,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            ingredients: recipe.ingredients || []
        })
        onClose()
    }

    return (
        <Card className="dark:bg-slate-900 border-none">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white">
                    {(initialValues as MealEntry)?.id ? `Edit ${mealType}` : `Add ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`}
                </h3>
                <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                    <X size={20} />
                </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
                <button
                    type="button"
                    onClick={() => setMode('manual')}
                    className={cn(
                        "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        mode === 'manual' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    )}
                >
                    <PenTool size={14} />
                    Manual
                </button>
                <button
                    type="button"
                    onClick={() => setMode('recipe')}
                    className={cn(
                        "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        mode === 'recipe' ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    )}
                >
                    <BookOpen size={14} />
                    Recipe Book
                </button>
            </div>


            {mode === 'manual' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Food Name
                        </label>
                        <input
                            value={name} onChange={e => setName(e.target.value)}
                            className={cn(
                                "w-full p-3 rounded-xl border focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white",
                                errors.name ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                            )}
                            placeholder="e.g. Avocado Toast"
                            autoFocus
                        />
                        {errors.name && <span className="text-[10px] text-rose-500 mt-1 ml-1 font-bold italic">{errors.name}</span>}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Protein (g)</label>
                            <input type="number" value={protein} onChange={e => setProtein(e.target.value)}
                                className={cn(
                                    "w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm",
                                    errors.protein ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                                )}
                                placeholder="0"
                            />
                            {errors.protein && <div className="text-[8px] text-rose-500 mt-1 font-bold">{errors.protein}</div>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Carbs (g)</label>
                            <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)}
                                className={cn(
                                    "w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm",
                                    errors.carbs ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                                )}
                                placeholder="0"
                            />
                            {errors.carbs && <div className="text-[8px] text-rose-500 mt-1 font-bold">{errors.carbs}</div>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fat (g)</label>
                            <input type="number" value={fat} onChange={e => setFat(e.target.value)}
                                className={cn(
                                    "w-full p-2 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm",
                                    errors.fat ? "border-rose-500" : "border-slate-200 dark:border-slate-700"
                                )}
                                placeholder="0"
                            />
                            {errors.fat && <div className="text-[8px] text-rose-500 mt-1 font-bold">{errors.fat}</div>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Calories</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={calories}
                                    onChange={e => {
                                        setCalories(e.target.value);
                                        setCaloriesManuallyEdited(true);
                                    }}
                                    className={cn(
                                        "w-full p-3 rounded-xl border focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white",
                                        errors.calories ? "border-rose-500 focus:ring-rose-500/20" : "border-slate-200 dark:border-slate-700 focus:ring-blue-500"
                                    )}
                                    placeholder="0"
                                />
                                {!caloriesManuallyEdited && (Number(protein) > 0 || Number(carbs) > 0 || Number(fat) > 0) && (
                                    <div className="flex items-center mt-1">
                                        <span className="text-[10px] text-emerald-500 font-bold">
                                            ✓ Auto-calculated from macros
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setCaloriesManuallyEdited(false)}
                                            className="text-[10px] text-slate-400 underline ml-2"
                                        >
                                            recalculate
                                        </button>
                                    </div>
                                )}
                            </div>
                            {errors.calories && <span className="text-[10px] text-rose-500 mt-1 ml-1 font-bold italic">{errors.calories}</span>}
                        </div>
                    </div>

                    {/* AI Insight Section */}
                    {initialValues?.healthScore && (
                        <div className="glass p-4 rounded-2xl border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/20">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm ring-2 relative",
                                    initialValues.healthScore >= 8 ? "bg-emerald-500 text-white ring-emerald-200" :
                                        initialValues.healthScore >= 5 ? "bg-amber-500 text-white ring-amber-200" :
                                            "bg-rose-500 text-white ring-rose-200"
                                )}>
                                    <Brain size={12} className="absolute -top-1 -right-1 text-white/40" />
                                    {initialValues.healthScore}
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">Health Score</div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Analysis</div>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium leading-relaxed">
                                "{initialValues.reasoning}"
                            </p>
                        </div>
                    )}



                    <Button
                        type="submit"
                        fullWidth
                        variant="outline"
                        className={cn(
                            "mt-2 transition-all active:scale-[0.98]",
                            "bg-white dark:bg-slate-800 text-black dark:text-white hover:text-orange-500 hover:border-orange-500 dark:hover:text-orange-400 dark:hover:border-orange-500 font-black uppercase tracking-widest text-xs"
                        )}
                    >
                        <Check size={18} className="mr-2" />
                        {(initialValues as MealEntry)?.id ? "Confirm & Update" : "Confirm & Add"}
                    </Button>
                </form>
            ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {recipeBook.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No saved recipes yet</p>
                        </div>
                    ) : (
                        recipeBook.map(recipe => (
                            <div
                                key={recipe.id}
                                onClick={() => handleRecipeSelect(recipe)}
                                className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex justify-between items-center cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors group"
                            >
                                <div>
                                    <div className="font-semibold text-slate-800 dark:text-white text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400">{recipe.name}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                        <span>P: {recipe.protein}g • C: {recipe.carbs}g • F: {recipe.fat}g</span>
                                        {recipe.healthScore && (
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded-md text-[8px] font-black text-white",
                                                recipe.healthScore >= 8 ? "bg-emerald-500" :
                                                    recipe.healthScore >= 5 ? "bg-amber-500" :
                                                        "bg-rose-500"
                                            )}>
                                                {recipe.healthScore}/10
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="font-bold text-slate-700 dark:text-gray-200 text-sm">
                                    {recipe.calories} Cal
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </Card>
    )
}
