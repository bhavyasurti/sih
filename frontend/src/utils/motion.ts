import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Checks whether user prefers reduced motion
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface PageEntranceOptions {
  selector?: string
  stagger?: number
  deps?: React.DependencyList
}

/**
 * Hook to apply a coordinated, staggered entrance animation for page contents
 */
export function usePageEntrance(
  containerRef: React.RefObject<HTMLElement | null>,
  depsOrOptions?: PageEntranceOptions | React.DependencyList | string,
  stagger: number = 0.07
) {
  let selector = '.animate-reveal'
  let staggerVal = stagger
  let deps: React.DependencyList = []

  if (Array.isArray(depsOrOptions)) {
    deps = depsOrOptions
  } else if (typeof depsOrOptions === 'string') {
    selector = depsOrOptions
  } else if (depsOrOptions && typeof depsOrOptions === 'object') {
    const opts = depsOrOptions as PageEntranceOptions
    if (opts.selector) selector = opts.selector
    if (opts.stagger !== undefined) staggerVal = opts.stagger
    if (opts.deps) deps = opts.deps
  }

  useEffect(() => {
    const el = containerRef.current
    if (!el || isReducedMotion()) return

    const targets = el.querySelectorAll(selector)
    if (!targets || targets.length === 0) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: staggerVal,
          ease: 'power3.out',
          clearProps: 'all',
        }
      )
    }, containerRef)

    return () => ctx.revert()
  }, [containerRef, selector, staggerVal, ...deps])
}

/**
 * Hook to apply viewport scroll-triggered reveals with ScrollTrigger
 */
export function useScrollReveals(
  containerRef: React.RefObject<HTMLElement | null>,
  selector: string = '.gsap-reveal'
) {
  useEffect(() => {
    const el = containerRef.current
    if (!el || isReducedMotion()) return

    const ctx = gsap.context(() => {
      ScrollTrigger.refresh()

      const elements = el.querySelectorAll(selector)
      elements.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: item,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [containerRef, selector])
}
