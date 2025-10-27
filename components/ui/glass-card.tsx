import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const glassCardVariants = cva(
  'rounded-xl transition-all duration-300 will-change-transform',
  {
    variants: {
      variant: {
        intense: 'glass-intense',
        moderate: 'glass-moderate',
        subtle: 'glass-subtle',
        default: 'glass',
      },
      hover: {
        lift: 'glass-hover-lift',
        glow: 'hover:glow-primary transition-shadow duration-300',
        none: '',
      },
      border: {
        glow: 'glass-border-glow',
        default: '',
      },
    },
    defaultVariants: {
      variant: 'intense',
      hover: 'lift',
      border: 'glow',
    },
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {
  asChild?: boolean
}

function GlassCard({
  className,
  variant,
  hover,
  border,
  ...props
}: GlassCardProps) {
  return (
    <div
      data-slot="glass-card"
      className={cn(glassCardVariants({ variant, hover, border }), className)}
      {...props}
    />
  )
}

function GlassCardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glass-card-header"
      className={cn(
        '@container/glass-card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className
      )}
      {...props}
    />
  )
}

function GlassCardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glass-card-title"
      className={cn(
        'leading-none font-semibold text-white text-lg md:text-xl',
        className
      )}
      {...props}
    />
  )
}

function GlassCardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glass-card-description"
      className={cn('text-white/70 text-sm leading-relaxed', className)}
      {...props}
    />
  )
}

function GlassCardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glass-card-content"
      className={cn('px-6 pb-6', className)}
      {...props}
    />
  )
}

function GlassCardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="glass-card-footer"
      className={cn('flex items-center px-6 pb-6 pt-2', className)}
      {...props}
    />
  )
}

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  glassCardVariants,
}
