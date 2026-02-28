import { type HTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-800 p-5 text-slate-900 dark:text-slate-100 transition-colors", className)}
            {...props}
        />
    )
)

Card.displayName = "Card"
export { Card }
