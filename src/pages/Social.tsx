import { useState } from "react"
import { Feed } from "../components/social/Feed"
import { CreatePostModal } from "../components/social/CreatePostModal"
import { Plus, Sparkles } from "lucide-react"
import { useAppStore } from "../store/useAppStore"
import { toast } from "sonner"
import type { Post } from "../services/social"

export default function Social() {
    const [showCreatePost, setShowCreatePost] = useState(false)
    const [postToEdit, setPostToEdit] = useState<Post | null>(null)
    const user = useAppStore(state => state.user)

    const handleCreateClick = () => {
        if (!user.isAuthenticated) {
            toast.error("Please login to post recipes")
            return
        }
        setShowCreatePost(true)
    }

    const handleEditPost = (post: Post) => {
        setPostToEdit(post)
    }

    return (
        <div className="page-container bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 space-y-6">
            <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-orange-200/10 dark:bg-orange-500/5 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-rose-200/10 dark:bg-rose-500/5 rounded-full blur-[100px] -z-10" />

            <div className="max-w-2xl mx-auto space-y-6">
                <header className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/40">
                            <Sparkles size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                                Community Recipes
                            </h1>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">
                                Share, discover, and save ideas
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="h-11 px-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-black flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 active:scale-95 transition-transform"
                    >
                        <Plus size={16} />
                        New Post
                    </button>
                </header>

                <Feed onEditPost={handleEditPost} />

                {(showCreatePost || postToEdit) && (
                    <CreatePostModal
                        postToEdit={postToEdit || undefined}
                        onClose={() => {
                            setShowCreatePost(false)
                            setPostToEdit(null)
                        }}
                        onPostCreated={() => {
                            window.location.reload()
                        }}
                    />
                )}
            </div>
        </div>
    )
}

