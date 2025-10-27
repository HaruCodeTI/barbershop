"use client"

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const glassButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 will-change-transform active:scale-95',
  {
    variants: {
      variant: {
        glass: 'glass text-white hover:glow-primary',
        'glass-intense': 'glass-intense text-white hover:glow-primary-intense',
        primary:
          'bg-primary text-white hover:bg-primary/90 hover:scale-105 hover:shadow-lg hover:shadow-primary/50',
        outline:
          'glass-subtle text-white border-2 border-primary/30 hover:border-primary hover:glow-primary',
        ghost: 'hover:glass-subtle text-white/90 hover:text-white',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 rounded-md px-4 py-2 text-xs',
        lg: 'h-14 rounded-lg px-8 py-4 text-base',
        icon: 'size-11',
        'icon-sm': 'size-9',
        'icon-lg': 'size-14',
      },
      glow: {
        true: 'hover:glow-primary-intense',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'glass-intense',
      size: 'default',
      glow: false,
    },
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, glow, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const [ripples, setRipples] = React.useState<
      Array<{ x: number; y: number; id: number }>
    >([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now()

      setRipples((prev) => [...prev, { x, y, id }])

      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
      }, 600)

      props.onClick?.(e)
    }

    return (
      <Comp
        ref={ref}
        data-slot="glass-button"
        className={cn(
          glassButtonVariants({ variant, size, glow }),
          'relative overflow-hidden',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {props.children}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </Comp>
    )
  }
)

GlassButton.displayName = 'GlassButton'

export { GlassButton, glassButtonVariants }
