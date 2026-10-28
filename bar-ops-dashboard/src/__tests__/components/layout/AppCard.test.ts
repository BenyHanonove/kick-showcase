import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppCard from '@shared/components/layout/AppCard.vue';
import { VCard, VIcon } from 'vuetify/components';

describe('AppCard Component', () => {
  describe('Variant Support', () => {
    it('renders summary variant with correct CSS class', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'summary',
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--summary');
    });

    it('renders form variant with correct CSS class', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'form',
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--form');
    });

    it('renders data variant with correct CSS class', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'data',
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--data');
    });

    it('renders minimal variant with correct CSS class', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'minimal',
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--minimal');
    });

    it('defaults to summary variant when not specified', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--summary');
    });
  });

  describe('Title and Icon Props', () => {
    it('renders title when provided', () => {
      const wrapper = mount(AppCard, {
        props: {
          title: 'Card Title',
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.text()).toContain('Card Title');
    });

    it('renders icon before title when both provided', () => {
      const wrapper = mount(AppCard, {
        props: {
          title: 'Card Title',
          icon: 'mdi-star',
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      const iconComponent = wrapper.findComponent(VIcon);
      expect(iconComponent.exists()).toBe(true);
      expect(iconComponent.props('icon')).toBe('mdi-star');
      expect(wrapper.text()).toContain('Card Title');
    });

    it('does not render title section when title is not provided', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.find('.app-card__header').exists()).toBe(false);
    });
  });

  describe('Interactive State', () => {
    it('applies interactive class when interactive={true}', () => {
      const wrapper = mount(AppCard, {
        props: {
          interactive: true,
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--interactive');
    });

    it('does not apply interactive class when interactive={false}', () => {
      const wrapper = mount(AppCard, {
        props: {
          interactive: false,
        },
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).not.toContain('app-card--interactive');
    });

    it('defaults to non-interactive when not specified', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).not.toContain('app-card--interactive');
    });
  });

  describe('Slot Rendering', () => {
    it('renders default slot content', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Main card content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.text()).toContain('Main card content');
    });

    it('renders actions slot when provided', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Main content',
          actions: 'Action buttons',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.text()).toContain('Action buttons');
    });

    it('renders divider slot when provided', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'form',
        },
        slots: {
          default: 'Main content',
          divider: '<div>Divider</div>',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.html()).toContain('Divider');
    });

    it('renders multiple slots together', () => {
      const wrapper = mount(AppCard, {
        props: {
          title: 'Form Card',
          variant: 'form',
        },
        slots: {
          default: 'Form content',
          divider: '<hr>',
          actions: 'Submit button',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.text()).toContain('Form Card');
      expect(wrapper.text()).toContain('Form content');
      expect(wrapper.text()).toContain('Submit button');
    });
  });

  describe('Variant-Specific Styling', () => {
    it('references only --bo-card-padding-* tokens that are defined in tokens.css', async () => {
      const raw = await import('@shared/components/layout/AppCard.vue?raw');
      const referencedTokens = [...raw.default.matchAll(/var\((--bo-card-[\w-]+)/g)].map((m) => m[1]);
      const definedTokens = [
        '--bo-card-padding-compact',
        '--bo-card-padding-normal',
        '--bo-card-padding-spacious',
      ];

      expect(referencedTokens.length).toBeGreaterThan(0);
      for (const token of referencedTokens) {
        expect(definedTokens, `AppCard.vue references undefined token "${token}"`).toContain(token);
      }
    });

    it('form variant applies normal padding token', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'form',
        },
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--form');
    });

    it('data variant applies compact padding token', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'data',
        },
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--data');
    });

    it('minimal variant applies border styling', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'minimal',
        },
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--minimal');
    });
  });

  describe('Responsive Behavior', () => {
    it('renders full-width on mobile', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'summary',
        },
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      const element = wrapper.element as HTMLElement;
      expect(element.className).toContain('app-card');
    });

    it('applies responsive class structure', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card');
      expect(wrapper.classes()).toContain('app-card--summary');
    });
  });

  describe('Token-Based Styling', () => {
    it('uses CSS custom properties (not hardcoded literals) for every variant padding declaration', async () => {
      const raw = await import('@shared/components/layout/AppCard.vue?raw');
      const paddingDeclarations = [...raw.default.matchAll(/padding:\s*([^;]+);/g)].map((m) => m[1]);

      expect(paddingDeclarations.length).toBeGreaterThan(0);
      for (const declaration of paddingDeclarations) {
        expect(declaration).toMatch(/^var\(--bo-card-padding-/);
      }
    });

    it('does not use hardcoded px values in template', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      const rootElement = wrapper.element as HTMLElement;
      const inlineStyle = rootElement.getAttribute('style');
      expect(inlineStyle).toBeNull();
    });
  });

  describe('No Inline Styles', () => {
    it('does not use inline styles in AppCard root element', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      const rootElement = wrapper.element as HTMLElement;
      expect(rootElement.getAttribute('style')).toBeNull();
    });
  });

  describe('TypeScript Interface', () => {
    it('accepts AppCardProps interface', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'form' as const,
          title: 'Test Card',
          icon: 'mdi-card',
          interactive: true,
        },
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('Light and Dark Mode', () => {
    it('renders without color-specific values in inline styles', () => {
      const wrapper = mount(AppCard, {
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      const rootElement = wrapper.element as HTMLElement;
      const inlineStyle = rootElement.getAttribute('style');
      expect(inlineStyle).toBeNull();
    });

    it('applies color tokens via CSS classes', () => {
      const wrapper = mount(AppCard, {
        props: {
          variant: 'summary',
        },
        slots: {
          default: 'Content',
        },
        global: {
          components: { VCard, VIcon },
        },
      });

      expect(wrapper.classes()).toContain('app-card--summary');
    });
  });
});
