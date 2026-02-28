import React from 'react'
import { User, Users, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FamilySelectorProps {
    members: string[]
    selected: string
    onSelect: (name: string) => void
    onAddMember: (name: string) => void
}

export const FamilySelector: React.FC<FamilySelectorProps> = ({
    members,
    selected,
    onSelect,
    onAddMember
}) => {
    const [isAdding, setIsAdding] = React.useState(false)
    const [newName, setNewName] = React.useState('')

    const handleAdd = () => {
        if (newName.trim()) {
            onAddMember(newName.trim())
            setNewName('')
            setIsAdding(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Users size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Assign To</span>
            </div>

            <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                    <button
                        key={member}
                        onClick={() => onSelect(member)}
                        className={cn(
                            "px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
                            selected === member
                                ? "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30"
                        )}
                    >
                        <User size={12} />
                        {member}
                    </button>
                ))}

                {isAdding ? (
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-2xl px-2 py-1">
                        <input
                            autoFocus
                            className="bg-transparent border-none focus:outline-none text-[11px] font-bold text-slate-800 dark:text-white w-20 px-1"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <button onClick={handleAdd} className="text-indigo-500 hover:text-indigo-600">
                            <Plus size={16} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>
        </div>
    )
}
