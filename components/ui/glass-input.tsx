import * as React from 'react'
import { cn } from '@/lib/utils'

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl glass-moderate border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 transition-all duration-300',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:glass-intense',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'hover:border-white/20 hover:glass-intense',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

GlassInput.displayName = 'GlassInput'

export { GlassInput }
