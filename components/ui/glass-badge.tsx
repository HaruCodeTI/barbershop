import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const glassBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'glass-moderate text-white border border-white/10',
        primary: 'glass-moderate text-primary border border-primary/30 hover:glow-primary',
        success: 'glass-moderate text-green-400 border border-green-500/30',
        warning: 'glass-moderate text-yellow-400 border border-yellow-500/30',
        destructive: 'glass-moderate text-red-400 border border-red-500/30',
        outline: 'glass-subtle text-white/80 border border-white/20 hover:border-white/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface GlassBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassBadgeVariants> {}

function GlassBadge({ className, variant, ...props }: GlassBadgeProps) {
  return (
    <div
      className={cn(glassBadgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { GlassBadge, glassBadgeVariants }
