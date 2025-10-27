"use client"

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface UseScrollAnimationOptions {
  /**
   * Animation type to apply
   */
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'custom'
  /**
   * Duration of animation in seconds
   */
  duration?: number
  /**
   * Delay before animation starts in seconds
   */
  delay?: number
  /**
   * Stagger delay between multiple elements in seconds
   */
  stagger?: number
  /**
   * Custom GSAP animation properties (for animation: 'custom')
   */
  customAnimation?: gsap.TweenVars
  /**
   * ScrollTrigger start position
   */
  start?: string
  /**
   * ScrollTrigger end position
   */
  end?: string
  /**
   * Enable scrub (animation tied to scroll position)
   */
  scrub?: boolean | number
  /**
   * Disable on mobile devices
   */
  disableOnMobile?: boolean
}

export function useScrollAnimation<T extends HTMLElement = HTMLElement>(
  options: UseScrollAnimationOptions = {}
) {
  const ref = useRef<T>(null)
  const {
    animation = 'fadeIn',
    duration = 0.8,
    delay = 0,
    stagger = 0,
    customAnimation,
    start = 'top 80%',
    end = 'bottom 20%',
    scrub = false,
    disableOnMobile = false,
  } = options

  useEffect(() => {
    if (!ref.current) return

    // Check if we should disable on mobile
    if (disableOnMobile && window.innerWidth < 768) {
      return
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      // Show element immediately without animation
      gsap.set(ref.current, { opacity: 1, y: 0, x: 0, scale: 1 })
      return
    }

    const element = ref.current
    const children = element.children.length > 0 ? element.children : [element]

    // Define animation presets
    const animations: Record<string, gsap.TweenVars> = {
      fadeIn: {
        opacity: 0,
        duration,
        delay,
        ease: 'power2.out',
      },
      slideUp: {
        y: 60,
        opacity: 0,
        duration,
        delay,
        ease: 'power3.out',
      },
      slideLeft: {
        x: 60,
        opacity: 0,
        duration,
        delay,
        ease: 'power3.out',
      },
      slideRight: {
        x: -60,
        opacity: 0,
        duration,
        delay,
        ease: 'power3.out',
      },
      scale: {
        scale: 0.8,
        opacity: 0,
        duration,
        delay,
        ease: 'back.out(1.7)',
      },
      custom: customAnimation || {},
    }

    const fromVars = animations[animation]

    // Set initial state
    gsap.set(children, fromVars)

    // Create animation with ScrollTrigger
    const animation$ = gsap.to(children, {
      ...fromVars,
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      stagger: stagger,
      scrollTrigger: {
        trigger: element,
        start,
        end,
        scrub,
        once: !scrub, // If scrub is enabled, don't use once
      },
    })

    return () => {
      animation$.kill()
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill()
        }
      })
    }
  }, [
    animation,
    duration,
    delay,
    stagger,
    customAnimation,
    start,
    end,
    scrub,
    disableOnMobile,
  ])

  return ref
}
