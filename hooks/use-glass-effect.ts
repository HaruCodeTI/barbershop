"use client"

import { useEffect, useRef } from 'react'

interface UseGlassEffectOptions {
  /**
   * Enable mouse tracking effect
   */
  mouseTracking?: boolean
  /**
   * Intensity of the glow effect (0-1)
   */
  glowIntensity?: number
  /**
   * Enable parallax effect on card
   */
  parallax?: boolean
  /**
   * Parallax intensity
   */
  parallaxIntensity?: number
}

export function useGlassEffect<T extends HTMLElement = HTMLElement>(
  options: UseGlassEffectOptions = {}
) {
  const ref = useRef<T>(null)
  const {
    mouseTracking = true,
    glowIntensity = 0.3,
    parallax = false,
    parallaxIntensity = 10,
  } = options

  useEffect(() => {
    if (!ref.current || !mouseTracking) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Calculate position as percentage
      const xPercent = (x / rect.width) * 100
      const yPercent = (y / rect.height) * 100

      // Apply glow effect
      const glowX = (x / rect.width - 0.5) * 100
      const glowY = (y / rect.height - 0.5) * 100

      element.style.setProperty(
        '--glow-x',
        `${50 + glowX * glowIntensity}%`
      )
      element.style.setProperty(
        '--glow-y',
        `${50 + glowY * glowIntensity}%`
      )

      // Apply parallax if enabled
      if (parallax) {
        const rotateX = (yPercent - 50) / parallaxIntensity
        const rotateY = (50 - xPercent) / parallaxIntensity

        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
      }
    }

    const handleMouseLeave = () => {
      element.style.setProperty('--glow-x', '50%')
      element.style.setProperty('--glow-y', '50%')

      if (parallax) {
        element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
      }
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    // Add CSS variables
    element.style.setProperty('--glow-x', '50%')
    element.style.setProperty('--glow-y', '50%')
    element.style.transition = 'transform 0.3s ease-out'

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mouseTracking, glowIntensity, parallax, parallaxIntensity])

  return ref
}
