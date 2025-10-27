import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Default GSAP animation configurations
 */
export const ANIMATION_DEFAULTS = {
  duration: 0.8,
  ease: 'power3.out',
  stagger: 0.1,
} as const

/**
 * Easing presets
 */
export const EASING = {
  smooth: 'power2.out',
  snappy: 'power3.out',
  elastic: 'elastic.out(1, 0.5)',
  bounce: 'bounce.out',
  back: 'back.out(1.7)',
} as const

/**
 * Common animation presets
 */
export const ANIMATION_PRESETS = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: ANIMATION_DEFAULTS.duration, ease: EASING.smooth },
  },
  slideUp: {
    from: { y: 60, opacity: 0 },
    to: { y: 0, opacity: 1, duration: ANIMATION_DEFAULTS.duration, ease: EASING.snappy },
  },
  slideDown: {
    from: { y: -60, opacity: 0 },
    to: { y: 0, opacity: 1, duration: ANIMATION_DEFAULTS.duration, ease: EASING.snappy },
  },
  slideLeft: {
    from: { x: 60, opacity: 0 },
    to: { x: 0, opacity: 1, duration: ANIMATION_DEFAULTS.duration, ease: EASING.snappy },
  },
  slideRight: {
    from: { x: -60, opacity: 0 },
    to: { x: 0, opacity: 1, duration: ANIMATION_DEFAULTS.duration, ease: EASING.snappy },
  },
  scale: {
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: ANIMATION_DEFAULTS.duration, ease: EASING.back },
  },
  scaleDown: {
    from: { scale: 1.2, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: ANIMATION_DEFAULTS.duration, ease: EASING.smooth },
  },
  rotate: {
    from: { rotation: -180, opacity: 0, scale: 0.5 },
    to: { rotation: 0, opacity: 1, scale: 1, duration: 1, ease: EASING.back },
  },
} as const

/**
 * ScrollTrigger configurations
 */
export const SCROLL_TRIGGER_DEFAULTS = {
  start: 'top 80%',
  end: 'bottom 20%',
  toggleActions: 'play none none none',
  once: true,
} as const

/**
 * Stagger configurations for multiple elements
 */
export const STAGGER_PRESETS = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.2,
  fromCenter: {
    amount: 0.15,
    from: 'center',
    grid: 'auto',
  },
  grid: {
    amount: 0.15,
    from: 'start',
    grid: 'auto',
  },
} as const

/**
 * Create a staggered fade-in animation
 */
export function createStaggerAnimation(
  elements: Element | Element[] | string,
  options: {
    animation?: keyof typeof ANIMATION_PRESETS
    stagger?: number | typeof STAGGER_PRESETS[keyof typeof STAGGER_PRESETS]
    scrollTrigger?: ScrollTrigger.Vars
    delay?: number
  } = {}
) {
  const {
    animation = 'fadeIn',
    stagger = STAGGER_PRESETS.normal,
    scrollTrigger,
    delay = 0,
  } = options

  const preset = ANIMATION_PRESETS[animation]

  gsap.set(elements, preset.from)

  return gsap.to(elements, {
    ...preset.to,
    stagger,
    delay,
    scrollTrigger: scrollTrigger
      ? {
          ...SCROLL_TRIGGER_DEFAULTS,
          ...scrollTrigger,
        }
      : undefined,
  })
}

/**
 * Create a gradient animation for hero sections
 */
export function createGradientAnimation(element: Element | string) {
  return gsap.to(element, {
    backgroundPosition: '200% 50%',
    duration: 15,
    ease: 'none',
    repeat: -1,
    yoyo: true,
  })
}

/**
 * Create a parallax scroll effect
 */
export function createParallaxEffect(
  element: Element | string,
  options: {
    speed?: number
    start?: string
    end?: string
  } = {}
) {
  const { speed = 0.5, start = 'top bottom', end = 'bottom top' } = options

  return gsap.to(element, {
    y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: element,
      start,
      end,
      scrub: true,
      invalidateOnRefresh: true,
    },
  })
}

/**
 * Create a hover lift animation
 */
export function createHoverLift(
  element: Element,
  options: {
    y?: number
    scale?: number
    duration?: number
    glow?: boolean
  } = {}
) {
  const { y = -8, scale = 1.02, duration = 0.3, glow = true } = options

  const hoverAnimation = gsap.to(element, {
    y,
    scale,
    duration,
    ease: EASING.smooth,
    paused: true,
    boxShadow: glow
      ? '0 16px 48px 0 rgba(0, 0, 0, 0.5), 0 0 80px 0 rgba(140, 82, 255, 0.15)'
      : undefined,
  })

  element.addEventListener('mouseenter', () => hoverAnimation.play())
  element.addEventListener('mouseleave', () => hoverAnimation.reverse())

  return hoverAnimation
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Disable animations if user prefers reduced motion
 */
export function initAccessibility() {
  if (prefersReducedMotion()) {
    gsap.globalTimeline.timeScale(1000) // Speed up animations to nearly instant
    ScrollTrigger.config({
      limitCallbacks: true,
    })
  }
}

/**
 * Cleanup all GSAP animations and ScrollTriggers
 */
export function cleanupAnimations() {
  gsap.killTweensOf('*')
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
}
