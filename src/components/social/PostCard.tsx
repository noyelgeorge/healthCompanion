import { useState } from "react"
import { type Post, toggleLikePost, deletePost } from "../../services/social"
import { useAppStore } from "../../store/useAppStore"
import {
    Heart,
    Trash2,
    BookOpen,
    Package,
    Loader2,
    ChefHat,
    Pencil,
    Flame,
    Droplets,
    Wheat,
    Cookie,
    Brain
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "../../lib/utils"

interface PostCardProps {
    post: Post
    onDelete?: () => void
    onEdit?: (post: Post) => void
}

export function PostCard({ post, onDelete, onEdit }: PostCardProps) {
    const user = useAppStore(state => state.user)
    const recipeBook = useAppStore(state => state.recipeBook)
    const addToRecipeBook = useAppStore(state => state.addToRecipeBook)
    const removeFromRecipeBook = useAppStore(state => state.removeFromRecipeBook)

    // Check if already saved
    const savedItem = recipeBook.find(item => item.originalPostId === post.id)
    const isSaved = !!savedItem

    const isOwner = user.uid === post.authorId || user.email === post.authorId

    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isLiked, setIsLiked] = useState(
        (user.uid && post.likedBy?.includes(user.uid)) ||
        post.likedBy?.includes(user.email) ||
        false
    )
    const [likeCount, setLikeCount] = useState(post.likes)
    const [isExpanded, setIsExpanded] = useState(false)

    const handleSaveToggle = async () => {
        if (!user.isAuthenticated) {
            toast.error("Please login to save recipes")
            return
        }

        setIsSaving(true)
        try {
            if (isSaved) {
                // Unsave
                if (savedItem) {
                    await removeFromRecipeBook(savedItem.id)
                    toast.success("Removed", { description: "Removed from your saved items." })
                }
            } else {
                // Save
                await addToRecipeBook({
                    originalPostId: post.id,
                    name: post.title,
                    calories: post.calories,
                    protein: post.macros.protein,
                    carbs: post.macros.carbs,
                    fat: post.macros.fat,
                    healthScore: post.healthScore,
                    reasoning: post.reasoning,
                    ingredients: post.ingredients || [],
                    source: "community"
                });
                toast.success("Saved!", {
                    description: `${post.title} has been saved.`
                })
            }
        } catch {
            toast.error(isSaved ? "Failed to remove" : "Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

    const handleLikeToggle = async () => {
        if (!user.isAuthenticated) {
            toast.error("Please login to like posts")
            return
        }

        // Optimistic update
        const newIsLiked = !isLiked
        setIsLiked(newIsLiked)
        setLikeCount((prev: number) => newIsLiked ? prev + 1 : prev - 1)

        try {
            await toggleLikePost(post.id, user.uid || user.email, !newIsLiked)
        } catch {
            // Revert on error
            setIsLiked(!newIsLiked)
            setLikeCount((prev: number) => !newIsLiked ? prev + 1 : prev - 1)
            toast.error("Failed to update like")
        }
    }

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this post?")) return

        setIsDeleting(true)
        try {
            await deletePost(post.id)
            toast.success("Post deleted")
            onDelete?.()
        } catch {
            toast.error("Failed to delete post")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="group relative">
            {/* Glow effect on hover */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-indigo-500 rounded-[2.5rem] opacity-0 group-hover:opacity-20 blur-xl transition duration-700"></div>

            <div className="relative overflow-hidden rounded-[2.5rem] glass dark:glass-dark border-white/40 dark:border-slate-800/50 shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-1.5 flex flex-col">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-center gap-4 relative z-10">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-orange-500/20 ring-4 ring-white dark:ring-slate-900 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                            {(post.authorPhoto || (isOwner && user.photoURL)) ? (
                                <img
                                    src={post.authorPhoto || user.photoURL || ""}
                                    alt={post.authorName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                post.authorName.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-slate-900 rounded-full border-2 border-orange-500 flex items-center justify-center shadow-lg">
                            <ChefHat size={12} className="text-orange-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="font-black text-slate-800 dark:text-white text-lg tracking-tight">{post.authorName}</div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-orange-500 animate-pulse"></span>
                            Shared Recipe
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {post.healthScore && (
                            <div className={cn(
                                "h-10 px-3 rounded-2xl flex items-center gap-2 ring-1 shadow-lg",
                                post.healthScore >= 8 ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" :
                                    post.healthScore >= 5 ? "bg-amber-500/10 text-amber-600 ring-amber-500/20" :
                                        "bg-rose-500/10 text-rose-600 ring-rose-500/20"
                            )}>
                                <Brain size={14} className="fill-current opacity-50" />
                                <span className="font-black text-sm">{post.healthScore}</span>
                            </div>
                        )}

                        {isOwner && (
                            <div className="flex items-center gap-1 glass dark:bg-slate-800/30 p-1.5 rounded-2xl border-white/20 dark:border-slate-700/50">
                                <button
                                    onClick={() => onEdit?.(post)}
                                    className="p-2 text-slate-400 hover:text-orange-500 transition-colors"
                                    title="Edit Post"
                                >
                                    <Pencil size={18} />
                                </button>
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/50 mx-1"></div>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                    title="Delete Post"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-7 pb-4 pt-2 relative z-10">
                    <h3 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3 leading-tight tracking-tight">
                        {post.title}
                    </h3>
                    {post.description && (
                        <div className="relative">
                            <p className={cn(
                                "text-slate-600 dark:text-slate-400 text-sm leading-relaxed transition-all duration-300 font-medium",
                                !isExpanded && "line-clamp-2"
                            )}>
                                {post.description}
                            </p>
                            {post.description.length > 80 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-orange-600 dark:text-orange-400 font-black text-[10px] mt-2 uppercase tracking-[0.2em] transition-all hover:translate-x-1"
                                >
                                    {isExpanded ? "Collapse Intel" : "Read Full Stream"}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Image */}
                {post.image && (
                    <div className="relative w-[calc(100%-1.5rem)] mx-3 aspect-video bg-slate-100 dark:bg-slate-950 rounded-[1.5rem] overflow-hidden mb-6 shadow-inner ring-1 ring-white/10">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>
                )}

                {/* Footer Content */}
                <div className="px-7 pb-7">
                    {/* Macros Grid */}
                    {post.calories > 0 && (
                        <div className="grid grid-cols-4 gap-3 mb-8">
                            <div className="glass dark:bg-slate-950/40 p-3.5 rounded-2xl text-center border-white/20 dark:border-white/5 shadow-sm group/macro hover:scale-105 transition-transform duration-300">
                                <Flame size={18} className="mx-auto text-orange-500 mb-2" />
                                <div className="text-base font-black text-slate-900 dark:text-white tabular-nums">{post.calories}</div>
                                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Kcal</div>
                            </div>
                            <div className="glass dark:bg-slate-950/40 p-3.5 rounded-2xl text-center border-white/20 dark:border-white/5 shadow-sm group/macro hover:scale-105 transition-transform duration-300">
                                <Droplets size={18} className="mx-auto text-indigo-500 mb-2" />
                                <div className="text-base font-black text-slate-900 dark:text-white tabular-nums">{post.macros.protein}g</div>
                                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Prot</div>
                            </div>
                            <div className="glass dark:bg-slate-950/40 p-3.5 rounded-2xl text-center border-white/20 dark:border-white/5 shadow-sm group/macro hover:scale-105 transition-transform duration-300">
                                <Wheat size={18} className="mx-auto text-emerald-500 mb-2" />
                                <div className="text-base font-black text-slate-900 dark:text-white tabular-nums">{post.macros.carbs}g</div>
                                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Carb</div>
                            </div>
                            <div className="glass dark:bg-slate-950/40 p-3.5 rounded-2xl text-center border-white/20 dark:border-white/5 shadow-sm group/macro hover:scale-105 transition-transform duration-300">
                                <Cookie size={18} className="mx-auto text-amber-500 mb-2" />
                                <div className="text-base font-black text-slate-900 dark:text-white tabular-nums">{post.macros.fat}g</div>
                                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Fat</div>
                            </div>
                        </div>
                    )}

                    {/* Ingredients */}
                    {post.ingredients && post.ingredients.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                    <Package size={14} />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ingredients</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {post.ingredients.slice(0, 4).map((ing, i) => (
                                    <span key={i} className="text-[10px] px-4 py-2 glass dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-300 font-black uppercase tracking-wide border-white/20 dark:border-slate-700/50">
                                        {ing}
                                    </span>
                                ))}
                                {post.ingredients.length > 4 && (
                                    <span className="text-[10px] px-4 py-2 bg-orange-500 text-white rounded-xl font-black uppercase tracking-wide shadow-lg shadow-orange-500/20">
                                        +{post.ingredients.length - 4} More
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <button
                            onClick={handleLikeToggle}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95",
                                isLiked
                                    ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30"
                                    : "glass dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-white/20 dark:border-slate-700/50 shadow-md"
                            )}
                        >
                            <Heart size={18} className={cn(isLiked && "fill-current")} />
                            <span className="tabular-nums">{likeCount}</span>
                        </button>

                        <div className="flex-1" />

                        {(post.calories > 0 || (post.ingredients && post.ingredients.length > 0)) && (
                            <button
                                onClick={handleSaveToggle}
                                disabled={isSaving}
                                className={cn(
                                    "flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50",
                                    isSaved
                                        ? "bg-slate-900 text-white dark:bg-white dark:text-black"
                                        : "bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-orange-500/30"
                                )}
                            >
                                {isSaving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <BookOpen size={16} />
                                        <span className="text-xs font-black uppercase tracking-widest">
                                            {isSaved ? "Saved" : "Save Recipe"}
                                        </span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
