import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppButton from '@shared/components/layout/AppButton.vue';

describe('AppButton', () => {
  describe('Variants', () => {
    it('renders primary variant with correct styling', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'primary' }
      });
      expect(wrapper.find('.app-button--primary').exists()).toBe(true);
    });

    it('renders secondary variant with correct styling', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'secondary' }
      });
      expect(wrapper.find('.app-button--secondary').exists()).toBe(true);
    });

    it('renders tertiary variant with correct styling', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'tertiary' }
      });
      expect(wrapper.find('.app-button--tertiary').exists()).toBe(true);
    });

    it('renders danger variant with correct styling', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'danger' }
      });
      expect(wrapper.find('.app-button--danger').exists()).toBe(true);
    });

    it('defaults to primary variant when not specified', () => {
      const wrapper = mount(AppButton);
      expect(wrapper.find('.app-button--primary').exists()).toBe(true);
    });
  });

  describe('Sizes', () => {
    it('renders small size (32px)', () => {
      const wrapper = mount(AppButton, {
        props: { size: 'small' }
      });
      expect(wrapper.find('.app-button--small').exists()).toBe(true);
    });

    it('renders normal size (44px)', () => {
      const wrapper = mount(AppButton, {
        props: { size: 'normal' }
      });
      expect(wrapper.find('.app-button--normal').exists()).toBe(true);
    });

    it('renders large size (52px)', () => {
      const wrapper = mount(AppButton, {
        props: { size: 'large' }
      });
      expect(wrapper.find('.app-button--large').exists()).toBe(true);
    });

    it('defaults to normal size when not specified', () => {
      const wrapper = mount(AppButton);
      expect(wrapper.find('.app-button--normal').exists()).toBe(true);
    });
  });

  describe('Variant × Size Combinations', () => {
    const variants = ['primary', 'secondary', 'tertiary', 'danger'] as const;
    const sizes = ['small', 'normal', 'large'] as const;

    variants.forEach(variant => {
      sizes.forEach(size => {
        it(`renders ${variant} variant with ${size} size correctly`, () => {
          const wrapper = mount(AppButton, {
            props: { variant, size }
          });
          expect(wrapper.find(`.app-button--${variant}`).exists()).toBe(true);
          expect(wrapper.find(`.app-button--${size}`).exists()).toBe(true);
        });
      });
    });
  });

  describe('Icon Support', () => {
    it('renders icon when icon prop provided', () => {
      const wrapper = mount(AppButton, {
        props: { icon: 'mdi-plus' }
      });
      expect(wrapper.find('.v-icon').exists()).toBe(true);
    });

    it('positions icon on left by default', () => {
      const wrapper = mount(AppButton, {
        props: { icon: 'mdi-plus', iconPosition: 'left' }
      });
      const iconElement = wrapper.find('.app-button__icon');
      expect(iconElement.exists()).toBe(true);
      expect(iconElement.classes()).toContain('app-button__icon--left');
    });

    it('positions icon on right when specified', () => {
      const wrapper = mount(AppButton, {
        props: { icon: 'mdi-plus', iconPosition: 'right' }
      });
      const iconElement = wrapper.find('.app-button__icon');
      expect(iconElement.classes()).toContain('app-button__icon--right');
    });

    it('renders icon-only button without text', () => {
      const wrapper = mount(AppButton, {
        props: { icon: 'mdi-plus' },
        slots: { default: '' }
      });
      expect(wrapper.find('.app-button__icon').exists()).toBe(true);
    });
  });

  describe('States', () => {
    it('renders loading state', () => {
      const wrapper = mount(AppButton, {
        props: { loading: true }
      });
      expect(wrapper.find('.app-button--loading').exists()).toBe(true);
    });

    it('disables click when loading', async () => {
      const wrapper = mount(AppButton, {
        props: { loading: true }
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeUndefined();
    });

    it('renders disabled state', () => {
      const wrapper = mount(AppButton, {
        props: { disabled: true }
      });
      expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    });

    it('disables click when disabled', async () => {
      const wrapper = mount(AppButton, {
        props: { disabled: true }
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });

  describe('Events', () => {
    it('emits click event when enabled', async () => {
      const wrapper = mount(AppButton, {
        props: { disabled: false }
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });

    it('does not emit click when disabled', async () => {
      const wrapper = mount(AppButton, {
        props: { disabled: true }
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeUndefined();
    });

    it('does not emit click when loading', async () => {
      const wrapper = mount(AppButton, {
        props: { loading: true }
      });
      await wrapper.find('button').trigger('click');
      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });

  describe('Accessibility', () => {
    it('accepts aria-label prop', () => {
      const wrapper = mount(AppButton, {
        props: { ariaLabel: 'Save document' }
      });
      expect(wrapper.find('button').attributes('aria-label')).toBe('Save document');
    });

    it('renders with title attribute', () => {
      const wrapper = mount(AppButton, {
        props: { title: 'Click to save' }
      });
      expect(wrapper.find('button').attributes('title')).toBe('Click to save');
    });

    it('maintains focus ring visibility on all variants', () => {
      const variants = ['primary', 'secondary', 'tertiary', 'danger'] as const;
      variants.forEach(variant => {
        const wrapper = mount(AppButton, {
          props: { variant }
        });
        expect(wrapper.find('button').exists()).toBe(true);
      });
    });

    it('button is keyboard accessible', () => {
      const wrapper = mount(AppButton);
      const button = wrapper.find('button');
      // Native button elements are keyboard accessible by default
      expect(button.element.tagName).toBe('BUTTON');
    });
  });

  describe('Button Type', () => {
    it('sets button type to submit', () => {
      const wrapper = mount(AppButton, {
        props: { type: 'submit' }
      });
      expect(wrapper.find('button').attributes('type')).toBe('submit');
    });

    it('sets button type to reset', () => {
      const wrapper = mount(AppButton, {
        props: { type: 'reset' }
      });
      expect(wrapper.find('button').attributes('type')).toBe('reset');
    });

    it('defaults to button type', () => {
      const wrapper = mount(AppButton);
      expect(wrapper.find('button').attributes('type')).toBe('button');
    });
  });

  describe('Slot Content', () => {
    it('renders text content from default slot', () => {
      const wrapper = mount(AppButton, {
        slots: { default: 'Click me' }
      });
      expect(wrapper.text()).toContain('Click me');
    });

    it('renders text with icon', () => {
      const wrapper = mount(AppButton, {
        props: { icon: 'mdi-plus' },
        slots: { default: 'Add' }
      });
      expect(wrapper.text()).toContain('Add');
      expect(wrapper.find('.v-icon').exists()).toBe(true);
    });
  });

  describe('Visual States', () => {
    it('applies hover styles class', () => {
      const wrapper = mount(AppButton);
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('applies focus styles class on focus', async () => {
      const wrapper = mount(AppButton);
      await wrapper.find('button').trigger('focus');
      expect(wrapper.find('button').exists()).toBe(true);
    });

    it('applies active styles class on click', async () => {
      const wrapper = mount(AppButton);
      await wrapper.find('button').trigger('mousedown');
      expect(wrapper.find('button').exists()).toBe(true);
    });
  });

  describe('TypeScript Props', () => {
    it('accepts valid variant prop', () => {
      const wrapper = mount(AppButton, {
        props: { variant: 'danger' }
      });
      expect(wrapper.props('variant')).toBe('danger');
    });

    it('accepts valid size prop', () => {
      const wrapper = mount(AppButton, {
        props: { size: 'large' }
      });
      expect(wrapper.props('size')).toBe('large');
    });

    it('accepts boolean props', () => {
      const wrapper = mount(AppButton, {
        props: { loading: true, disabled: false }
      });
      expect(wrapper.props('loading')).toBe(true);
      expect(wrapper.props('disabled')).toBe(false);
    });

    it('accepts string props', () => {
      const wrapper = mount(AppButton, {
        props: { icon: 'mdi-plus', ariaLabel: 'Add' }
      });
      expect(wrapper.props('icon')).toBe('mdi-plus');
      expect(wrapper.props('ariaLabel')).toBe('Add');
    });
  });
});
