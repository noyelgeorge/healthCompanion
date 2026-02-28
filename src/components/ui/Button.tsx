import { type ButtonHTMLAttributes, forwardRef } from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth = false, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 active:scale-95",
                    {
                        'bg-primary text-white shadow-lg shadow-orange-200 hover:bg-orange-600': variant === 'primary',
                        'bg-secondary text-white shadow-lg shadow-cyan-200 hover:bg-cyan-600': variant === 'secondary',
                        'bg-transparent hover:bg-slate-100 text-slate-600': variant === 'ghost',
                        'border-2 border-slate-200 hover:bg-slate-50 text-slate-700': variant === 'outline',
                        'bg-red-50 text-red-600 hover:bg-red-100': variant === 'danger',
                        'h-9 px-3 text-sm': size === 'sm',
                        'h-12 px-6 py-3 text-base': size === 'md',
                        'h-14 px-8 text-lg': size === 'lg',
                        'w-full': fullWidth
                    },
                    className
                )}
                {...props}
            />
        )
    }
)

Button.displayName = "Button"
export { Button }
