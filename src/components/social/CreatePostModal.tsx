import { useState, useRef, useEffect } from "react"
import { useAppStore } from "../../store/useAppStore"
import { createPost, updatePost, type Post } from "../../services/social"
import { X, Plus, Loader2, Image as ImageIcon, Save, Camera, UtensilsCrossed, Flame, Droplets, Wheat, Cookie } from "lucide-react"
import { toast } from "sonner"
import { cn } from "../../lib/utils"


interface CreatePostModalProps {
    onClose: () => void
    onPostCreated: () => void
    postToEdit?: Post
}

export function CreatePostModal({ onClose, onPostCreated, postToEdit }: CreatePostModalProps) {
    const user = useAppStore(state => state.user)
    const isDesktopView = useAppStore(state => state.isDesktopView)

    const [title, setTitle] = useState(postToEdit?.title || "")
    const [description, setDescription] = useState(postToEdit?.description || "")
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(postToEdit?.image || null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Toggle for Post Type
    const [postType, setPostType] = useState<"recipe" | "photo">(
        postToEdit ? (postToEdit.ingredients.length > 0 ? "recipe" : "photo") : "recipe"
    )

    // Macros
    const [calories, setCalories] = useState(postToEdit?.calories?.toString() || "")
    const [protein, setProtein] = useState(postToEdit?.macros?.protein?.toString() || "")
    const [carbs, setCarbs] = useState(postToEdit?.macros?.carbs?.toString() || "")
    const [fat, setFat] = useState(postToEdit?.macros?.fat?.toString() || "")

    const [ingredientInput, setIngredientInput] = useState("")
    const [ingredients, setIngredients] = useState<string[]>(postToEdit?.ingredients || [])

    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reset state if postToEdit changes (though usually the modal is unmounted/remounted)
    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title)
            setDescription(postToEdit.description)
            setImagePreview(postToEdit.image || null)
            setPostType(postToEdit.ingredients.length > 0 ? "recipe" : "photo")
            setCalories(postToEdit.calories?.toString() || "")
            setProtein(postToEdit.macros?.protein?.toString() || "")
            setCarbs(postToEdit.macros?.carbs?.toString() || "")
            setFat(postToEdit.macros?.fat?.toString() || "")
            setIngredients(postToEdit.ingredients || [])
        }
    }, [postToEdit])

    const handleAddIngredient = () => {
        if (!ingredientInput.trim()) return
        setIngredients([...ingredients, ingredientInput.trim()])
        setIngredientInput("")
    }

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index))
    }


    // Client-side image compression
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')

                    // Max dimensions
                    const MAX_WIDTH = 800
                    const MAX_HEIGHT = 800
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    ctx?.drawImage(img, 0, 0, width, height)

                    // Compress to JPEG with 0.7 quality to keep size low for Firestore
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
                    resolve(compressedBase64)
                }
                img.onerror = (error) => reject(error)
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title || !user.isAuthenticated) {
            toast.error("Please fill in the required fields")
            return
        }

        setIsSubmitting(true)
        try {
            let finalizedImageUrl = imagePreview || ""

            if (imageFile) {
                // Compress and get Base64 string
                finalizedImageUrl = await compressImage(imageFile)
            }

            const postData = {
                title,
                description,
                image: finalizedImageUrl,
                calories: Number(calories) || 0,
                macros: {
                    protein: Number(protein) || 0,
                    carbs: Number(carbs) || 0,
                    fat: Number(fat) || 0
                },
                ingredients: postType === "recipe" ? ingredients : []
            }

            if (postToEdit) {
                await updatePost(postToEdit.id, postData)
                toast.success("Post Updated!", {
                    description: "Your changes have been saved."
                })
            } else {
                await createPost({
                    ...postData,
                    authorId: user.uid || user.email || "guest",
                    authorName: user.name || "Guest User",
                    authorPhoto: user.photoURL || undefined
                })

                toast.success("Recipe Posted!", {
                    description: "Your recipe is now live on the feed."
                })
            }

            onPostCreated()
            onClose()
        } catch (error) {
            console.error(error)
            toast.error(postToEdit ? "Failed to update post" : "Failed to post recipe", {
                description: error instanceof Error ? error.message : "Unknown error"
            })

        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className={cn(
            "fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4 transition-all",
            !isDesktopView && "left-1/2 -translate-x-1/2 w-full max-w-[430px]"
        )}>
            <div className="absolute inset-0 overflow-hidden -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-500/5 rounded-full blur-[120px] animate-pulse"></div>
            </div>

            <div className="w-full max-w-lg glass dark:glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl border-white/40 dark:border-slate-800/50 animate-in slide-in-from-bottom-12 duration-500 max-h-[90vh] flex flex-col relative">
                {/* Header */}
                <div className="p-6 border-b border-white/20 dark:border-slate-800/50 flex justify-between items-center shrink-0 relative z-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {postToEdit ? "Redefining Post" : (postType === "recipe" ? "Deploy Recipe" : "Broadcast Signal")}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transmission Terminal</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all hover:scale-105 active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto p-8 space-y-8 scrollbar-hide">

                    {/* Type Toggle */}
                    <div className="flex glass p-1.5 rounded-2xl border-white/20 dark:border-slate-800/50 shadow-inner">
                        <button
                            onClick={() => setPostType("recipe")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                postType === "recipe"
                                    ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-lg ring-1 ring-black/5 dark:ring-white/5"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            <UtensilsCrossed size={14} className={postType === "recipe" ? "text-orange-500" : "text-slate-400"} />
                            Culinary Blueprint
                        </button>
                        <button
                            onClick={() => setPostType("photo")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                postType === "photo"
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg ring-1 ring-black/5 dark:ring-white/5"
                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                        >
                            <Camera size={14} className={postType === "photo" ? "text-indigo-500" : "text-slate-400"} />
                            Visual Log
                        </button>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                {postType === "recipe" ? "Core Designation" : "Signal Caption"}
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full p-4 glass rounded-[1.25rem] border-white/20 dark:border-slate-800/50 focus:ring-4 focus:ring-orange-500/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold transition-all shadow-sm"
                                placeholder={postType === "recipe" ? "e.g. Protein Synthesis Bowl" : "Caption your transmission..."}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                {postType === "recipe" ? "Operational Intel" : "Secondary Metadata"}
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full p-4 glass rounded-[1.25rem] border-white/20 dark:border-slate-800/50 focus:ring-4 focus:ring-orange-500/10 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium transition-all min-h-[120px] shadow-sm resize-none"
                                placeholder="Describe the process or context..."
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                                Visual Capture
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />

                            {imagePreview ? (
                                <div className="relative rounded-[1.5rem] overflow-hidden aspect-video glass border-white/40 dark:border-slate-800/50 group shadow-xl ring-1 ring-white/10">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null)
                                                setImagePreview(null)
                                                if (fileInputRef.current) fileInputRef.current.value = ""
                                            }}
                                            className="w-12 h-12 bg-red-500 text-white rounded-2xl shadow-xl shadow-red-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-40 glass rounded-[1.5rem] border-dashed border-slate-300 dark:border-slate-800/50 flex flex-col items-center justify-center text-slate-400 hover:text-orange-500 hover:border-orange-500/50 transition-all group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="w-16 h-16 rounded-[1.25rem] glass dark:bg-slate-800/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg border-white/40">
                                        <ImageIcon size={28} className="group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initialize Optical Scan</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Macros - Conditional */}
                    {postType === "recipe" && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Biological Impact</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="group">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Energy Scale (Kcal)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={calories}
                                            onChange={e => setCalories(e.target.value)}
                                            className="w-full p-4 glass rounded-2xl border-white/20 dark:border-slate-800/50 focus:ring-4 focus:ring-orange-500/10 text-slate-800 dark:text-white font-black tabular-nums shadow-sm"
                                            placeholder="0"
                                        />
                                        <Flame size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 opacity-30" />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Protein Matrix (G)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={protein}
                                            onChange={e => setProtein(e.target.value)}
                                            className="w-full p-4 glass rounded-2xl border-white/20 dark:border-slate-800/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 dark:text-white font-black tabular-nums shadow-sm"
                                            placeholder="0"
                                        />
                                        <Droplets size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 opacity-30" />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Carb Density (G)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={carbs}
                                            onChange={e => setCarbs(e.target.value)}
                                            className="w-full p-4 glass rounded-2xl border-white/20 dark:border-slate-800/50 focus:ring-4 focus:ring-emerald-500/10 text-slate-800 dark:text-white font-black tabular-nums shadow-sm"
                                            placeholder="0"
                                        />
                                        <Wheat size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-30" />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Lipid Value (G)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={fat}
                                            onChange={e => setFat(e.target.value)}
                                            className="w-full p-4 glass rounded-2xl border-white/20 dark:border-slate-800/50 focus:ring-4 focus:ring-amber-500/10 text-slate-800 dark:text-white font-black tabular-nums shadow-sm"
                                            placeholder="0"
                                        />
                                        <Cookie size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 opacity-30" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ingredients - Conditional */}
                    {postType === "recipe" && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-75">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resource Manifest</h4>
                            </div>
                            <div className="flex gap-3 mb-4">
                                <input
                                    type="text"
                                    value={ingredientInput}
                                    onChange={e => setIngredientInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddIngredient()}
                                    className="flex-1 p-4 glass rounded-2xl border-white/20 dark:border-slate-800/50 focus:ring-4 focus:ring-indigo-500/10 text-slate-800 dark:text-white font-bold"
                                    placeholder="Component label..."
                                />
                                <button
                                    onClick={handleAddIngredient}
                                    className="w-14 h-14 glass flex items-center justify-center text-white bg-slate-900 dark:bg-slate-700 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-xl"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {ingredients.map((ing, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 glass dark:bg-slate-800/50 text-slate-800 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider border-white/20 dark:border-slate-700/50 group/ing">
                                        {ing}
                                        <button onClick={() => removeIngredient(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {ingredients.length === 0 && (
                                    <div className="w-full py-6 glass border-dashed dark:border-slate-800/50 rounded-2xl flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        Manifest Is Currently Empty
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/20 dark:border-slate-800/50 shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl relative z-10">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full h-16 bg-gradient-to-r from-orange-500 via-orange-600 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-[0_10px_40px_-10px_rgba(249,115,22,0.4)] hover:shadow-[0_15px_50px_-10px_rgba(249,115,22,0.6)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {isSubmitting ? (postToEdit ? "Updating Matrix..." : "Syncing Transmission...") : (postToEdit ? "Finalize Adjustments" : (postType === "recipe" ? "Commence Deployment" : "Execute Broadcast"))}
                    </button>
                </div>
            </div>
        </div>
    )
}
