import { useEffect, useState } from "react"
import { type Post, fetchFeed } from "../../services/social"
import { useAppStore } from "../../store/useAppStore"
import { PostCard } from "./PostCard"
import { Loader2, RefreshCw, Sparkles, Search, X, LayoutGrid, UserCircle } from "lucide-react"
import { cn } from "../../lib/utils"

interface FeedProps {
    onEditPost?: (post: Post) => void
}

export function Feed({ onEditPost }: FeedProps) {
    const user = useAppStore(state => state.user)
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<"all" | "mine">("all")

    const loadFeed = async (showLoading = true) => {
        if (showLoading) setIsLoading(true)
        setError(null)
        try {
            const data = await fetchFeed()
            setPosts(data)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Failed to load feed")
        } finally {
            if (showLoading) setIsLoading(false)
        }
    }

    useEffect(() => {
        loadFeed()
    }, [])

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesFilter = filterType === "all" || post.authorId === user.email

        return matchesSearch && matchesFilter
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="relative">
                    <Loader2 size={48} className="animate-spin text-orange-500" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-6 animate-pulse">Synchronizing Feed...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-20 px-4 glass rounded-[2.5rem] mt-10">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                    <X size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Sync Failed</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm font-medium px-4">{error}</p>
                <button
                    onClick={() => loadFeed()}
                    className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                    Reconnect
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8 relative">
            {/* Feed Controls */}
            <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Explore culinary blueprints..."
                            className="w-full pl-12 pr-12 py-4 glass rounded-2xl border-white/20 dark:border-slate-800/50 focus:ring-2 focus:ring-orange-500/30 placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white transition-all text-sm font-bold shadow-lg shadow-slate-200/50 dark:shadow-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex glass p-1 rounded-2xl border-white/20 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <button
                        onClick={() => setFilterType("all")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filterType === "all"
                                ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-md ring-1 ring-black/5 dark:ring-white/5"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        <LayoutGrid size={14} className={cn(filterType === "all" ? "text-orange-500" : "text-slate-400")} />
                        Global Protocol
                    </button>
                    <button
                        onClick={() => setFilterType("mine")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            filterType === "mine"
                                ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-md ring-1 ring-black/5 dark:ring-white/5"
                                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        )}
                    >
                        <UserCircle size={14} className={cn(filterType === "mine" ? "text-orange-500" : "text-slate-400")} />
                        Personal Archive
                    </button>
                </div>
            </div>

            {posts.length === 0 ? (
                <div className="text-center py-20 px-6 glass rounded-[2.5rem] border-dashed border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-500/20 dark:to-orange-400/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Sparkles size={40} className="text-orange-600 dark:text-orange-400 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Prime The Feed</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">No recipes yet — be the first to share!</p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
                            <Sparkles size={14} /> Be a Pioneer
                        </div>
                    </div>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16 glass rounded-[2rem] border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                        <Search size={28} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest">
                        {searchQuery ? `No signals for "${searchQuery}"` : "Archive is currently empty"}
                    </p>
                    {(searchQuery || filterType !== "all") && (
                        <button
                            onClick={() => { setSearchQuery(""); setFilterType("all") }}
                            className="text-orange-600 dark:text-orange-400 font-black text-[10px] mt-4 uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-transform"
                        >
                            Reset System Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-8 pb-10">
                    {filteredPosts.map((post, idx) => (
                        <div key={post.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <PostCard
                                post={post}
                                onDelete={() => loadFeed(false)}
                                onEdit={onEditPost}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-center pt-8 pb-12">
                <button
                    onClick={() => loadFeed()}
                    className="flex items-center gap-3 px-10 py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200/50 dark:shadow-none"
                >
                    <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                    Refresh Core
                </button>
            </div>
        </div>
    )
}
