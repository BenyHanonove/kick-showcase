import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import '../assets/styles/tokens.css'
import { spacing, radius, shadow, elevation, transition, typeScale } from '../config/theme/tokens'

describe('Design Tokens', () => {
  describe('Shadow tokens', () => {
    it('should have existing shadow states', () => {
      expect(shadow.card).toBeDefined()
      expect(shadow.raised).toBeDefined()
      expect(shadow.popover).toBeDefined()
    })

    it('should have new shadow states for interactive states', () => {
      expect(shadow.hover).toBeDefined()
      expect(shadow.dragActive).toBeDefined()
      expect(shadow.focused).toBeDefined()
    })

    it('should have correct shadow values', () => {
      expect(shadow.card).toBe('0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.06)')
      expect(shadow.raised).toBe('0 2px 6px rgba(15, 23, 42, 0.06), 0 12px 28px rgba(15, 23, 42, 0.10)')
      expect(shadow.popover).toBe('0 4px 12px rgba(15, 23, 42, 0.10), 0 20px 48px rgba(15, 23, 42, 0.16)')
      expect(shadow.hover).toBe('0 4px 8px rgba(15, 23, 42, 0.08)')
      expect(shadow.dragActive).toBe('0 8px 16px rgba(15, 23, 42, 0.12)')
      expect(shadow.focused).toBe('0 0 0 4px rgba(192, 105, 77, 0.1)')
    })
  })

  describe('Spacing tokens', () => {
    it('should have existing spacing values', () => {
      expect(spacing.xs).toBe(4)
      expect(spacing.sm).toBe(8)
      expect(spacing.md).toBe(16)
      expect(spacing.lg).toBe(24)
      expect(spacing.xl).toBe(32)
      expect(spacing['2xl']).toBe(48)
    })

    it('should have new spacing variants for card padding', () => {
      expect(spacing.cardCompact).toBeDefined()
      expect(spacing.cardNormal).toBeDefined()
      expect(spacing.cardSpacious).toBeDefined()
    })

    it('should have new responsive breakpoint tokens', () => {
      expect(spacing.mobileGap).toBeDefined()
      expect(spacing.tabletGap).toBeDefined()
      expect(spacing.desktopGap).toBeDefined()
    })

    it('should have correct card padding and gap values', () => {
      expect(spacing.cardCompact).toBe(12)
      expect(spacing.cardNormal).toBe(16)
      expect(spacing.cardSpacious).toBe(24)
      expect(spacing.mobileGap).toBe(8)
      expect(spacing.tabletGap).toBe(16)
      expect(spacing.desktopGap).toBe(24)
    })
  })

  describe('Radius tokens', () => {
    it('should have existing radius values', () => {
      expect(radius.sm).toBe(10)
      expect(radius.md).toBe(14)
      expect(radius.lg).toBe(20)
      expect(radius.xl).toBe(28)
    })

    it('should have new semantic radius variants', () => {
      expect(radius.tight).toBeDefined()
      expect(radius.loose).toBeDefined()
    })

    it('should have correct semantic radius values', () => {
      expect(radius.tight).toBe(6)
      expect(radius.loose).toBe(32)
    })
  })

  describe('Transition tokens', () => {
    it('should export transition object', () => {
      expect(transition).toBeDefined()
    })

    it('should have timing tokens', () => {
      expect(transition.fast).toBeDefined()
      expect(transition.normal).toBeDefined()
      expect(transition.slow).toBeDefined()
    })

    it('should have correct timing values', () => {
      expect(transition.fast).toBe('150ms ease')
      expect(transition.normal).toBe('250ms ease-in-out')
      expect(transition.slow).toBe('400ms ease-out')
    })
  })

  describe('Elevation tokens', () => {
    it('should export elevation object', () => {
      expect(elevation).toBeDefined()
    })

    it('should have semantic elevation levels', () => {
      expect(elevation.base).toBeDefined()
      expect(elevation.raised).toBeDefined()
      expect(elevation.floating).toBeDefined()
      expect(elevation.modal).toBeDefined()
      expect(elevation.tooltip).toBeDefined()
    })

    it('should have correct elevation values', () => {
      expect(elevation.base).toBe(0)
      expect(elevation.raised).toBe(1)
      expect(elevation.floating).toBe(2)
      expect(elevation.modal).toBe(3)
      expect(elevation.tooltip).toBe(4)
    })
  })

  describe('Type scale tokens', () => {
    it('should retain existing type scale', () => {
      expect(typeScale.h1).toBeDefined()
      expect(typeScale.body1).toBeDefined()
    })
  })
})

describe('Design Tokens CSS Variables and Utilities', () => {
  let testElement: HTMLDivElement

  beforeEach(() => {
    testElement = document.createElement('div')
    document.body.appendChild(testElement)
  })

  afterEach(() => {
    if (testElement && testElement.parentNode) {
      document.body.removeChild(testElement)
    }
  })

  // Shadow utility classes
  describe('Shadow utility classes', () => {
    it('should have .shadow-card class defined', () => {
      const div = document.createElement('div')
      div.className = 'shadow-card'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.boxShadow).toBeTruthy()
      document.body.removeChild(div)
    })

    it('should have .shadow-raised class defined', () => {
      const div = document.createElement('div')
      div.className = 'shadow-raised'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.boxShadow).toBeTruthy()
      document.body.removeChild(div)
    })

    it('should have .shadow-hover class defined', () => {
      const div = document.createElement('div')
      div.className = 'shadow-hover'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.boxShadow).toBeTruthy()
      document.body.removeChild(div)
    })

    it('should have .shadow-drag class defined', () => {
      const div = document.createElement('div')
      div.className = 'shadow-drag'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.boxShadow).toBeTruthy()
      document.body.removeChild(div)
    })

    it('should have .shadow-focused class defined', () => {
      const div = document.createElement('div')
      div.className = 'shadow-focused'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.boxShadow).toBeTruthy()
      document.body.removeChild(div)
    })
  })

  // Utility classes verify CSS custom properties are available
  describe('CSS custom properties availability (tested via utility classes)', () => {
    it('shadow utility classes should apply shadows (confirms --bo-shadow-* props exist)', () => {
      const shadowClasses = ['shadow-card', 'shadow-raised', 'shadow-hover', 'shadow-drag', 'shadow-focused']
      shadowClasses.forEach(className => {
        const el = document.createElement('div')
        el.className = className
        document.body.appendChild(el)
        const styles = getComputedStyle(el)
        expect(styles.boxShadow).toBeTruthy()
        document.body.removeChild(el)
      })
    })

    it('transition utility classes should apply transitions (confirms --bo-transition-* props exist)', () => {
      const transitionClasses = ['transition-fast', 'transition-normal', 'transition-slow']
      transitionClasses.forEach(className => {
        const el = document.createElement('div')
        el.className = className
        document.body.appendChild(el)
        const styles = getComputedStyle(el)
        expect(styles.transition).toBeTruthy()
        document.body.removeChild(el)
      })
    })
  })

  // Transition utility classes
  describe('Transition utility classes', () => {
    it('should have .transition-fast class defined', () => {
      const div = document.createElement('div')
      div.className = 'transition-fast'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.transition).toBeTruthy()
      document.body.removeChild(div)
    })

    it('should have .transition-normal class defined', () => {
      const div = document.createElement('div')
      div.className = 'transition-normal'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.transition).toBeTruthy()
      document.body.removeChild(div)
    })

    it('should have .transition-slow class defined', () => {
      const div = document.createElement('div')
      div.className = 'transition-slow'
      document.body.appendChild(div)
      const styles = getComputedStyle(div)
      expect(styles.transition).toBeTruthy()
      document.body.removeChild(div)
    })
  })

})
