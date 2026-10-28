import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppInput from '@shared/components/input/AppInput.vue';
import { VTextField, VSelect, VCheckbox, VSwitch, VTextarea, VFileInput, VAutocomplete } from 'vuetify/components';

describe('AppInput Component', () => {
  describe('Type Support', () => {
    it('renders VTextField for text type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
        },
        global: {
          components: { VTextField },
        },
      });
      expect(wrapper.findComponent(VTextField).exists()).toBe(true);
    });

    it('renders VTextField with type="email" for email type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'email',
          modelValue: '',
        },
        global: {
          components: { VTextField },
        },
      });
      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.exists()).toBe(true);
      expect(vTextField.props('type')).toBe('email');
    });

    it('renders VTextField with type="number" for number type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'number',
          modelValue: 0,
        },
        global: {
          components: { VTextField },
        },
      });
      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.exists()).toBe(true);
      expect(vTextField.props('type')).toBe('number');
    });

    it('renders VTextField with type="password" for password type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'password',
          modelValue: '',
        },
        global: {
          components: { VTextField },
        },
      });
      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.exists()).toBe(true);
      expect(vTextField.props('type')).toBe('password');
    });

    it('renders VSelect for select type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'select',
          modelValue: null,
          items: [{ title: 'Option 1', value: 1 }],
        },
        global: {
          components: { VSelect },
        },
      });
      expect(wrapper.findComponent(VSelect).exists()).toBe(true);
    });

    it('renders VCheckbox for checkbox type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'checkbox',
          modelValue: false,
        },
        global: {
          components: { VCheckbox },
        },
      });
      expect(wrapper.findComponent(VCheckbox).exists()).toBe(true);
    });

    it('renders VSwitch for switch type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'switch',
          modelValue: false,
        },
        global: {
          components: { VSwitch },
        },
      });
      expect(wrapper.findComponent(VSwitch).exists()).toBe(true);
    });

    it('renders VTextarea for textarea type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'textarea',
          modelValue: '',
        },
        global: {
          components: { VTextarea },
        },
      });
      expect(wrapper.findComponent(VTextarea).exists()).toBe(true);
    });

    it('renders VFileInput for file type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'file',
          modelValue: null,
        },
        global: {
          components: { VFileInput },
        },
      });
      expect(wrapper.findComponent(VFileInput).exists()).toBe(true);
    });

    it('renders VAutocomplete for autocomplete type', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'autocomplete',
          modelValue: null,
          items: [{ title: 'Option 1', value: 1 }],
        },
        global: {
          components: { VAutocomplete },
        },
      });
      expect(wrapper.findComponent(VAutocomplete).exists()).toBe(true);
    });
  });

  describe('V-Model Binding', () => {
    it('emits update:modelValue for text input', async () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: 'initial',
        },
        global: {
          components: { VTextField },
        },
      });

      const vTextField = wrapper.findComponent(VTextField);
      await vTextField.vm.$emit('update:modelValue', 'updated');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['updated']);
    });

    it('emits update:modelValue for select input', async () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'select',
          modelValue: 1,
          items: [
            { title: 'Option 1', value: 1 },
            { title: 'Option 2', value: 2 },
          ],
        },
        global: {
          components: { VSelect },
        },
      });

      const vSelect = wrapper.findComponent(VSelect);
      await vSelect.vm.$emit('update:modelValue', 2);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([2]);
    });

    it('emits update:modelValue for checkbox input', async () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'checkbox',
          modelValue: false,
        },
        global: {
          components: { VCheckbox },
        },
      });

      const vCheckbox = wrapper.findComponent(VCheckbox);
      await vCheckbox.vm.$emit('update:modelValue', true);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([true]);
    });

    it('emits update:modelValue for switch input', async () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'switch',
          modelValue: false,
        },
        global: {
          components: { VSwitch },
        },
      });

      const vSwitch = wrapper.findComponent(VSwitch);
      await vSwitch.vm.$emit('update:modelValue', true);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([true]);
    });

    it('emits update:modelValue for autocomplete input', async () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'autocomplete',
          modelValue: 1,
          items: [
            { title: 'Option 1', value: 1 },
            { title: 'Option 2', value: 2 },
          ],
        },
        global: {
          components: { VAutocomplete },
        },
      });

      const vAutocomplete = wrapper.findComponent(VAutocomplete);
      await vAutocomplete.vm.$emit('update:modelValue', 2);

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([2]);
    });
  });

  describe('Props - Variant', () => {
    it('passes variant prop to VTextField', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          variant: 'filled',
        },
        global: {
          components: { VTextField },
        },
      });

      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.props('variant')).toBe('filled');
    });

    it('defaults to outlined variant when not specified', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
        },
        global: {
          components: { VTextField },
        },
      });

      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.props('variant')).toBe('outlined');
    });
  });

  describe('Props - Size', () => {
    it('applies compact size', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          size: 'compact',
        },
        global: {
          components: { VTextField },
        },
      });

      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.props('density')).toBe('compact');
    });

    it('applies normal size (comfortable density)', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          size: 'normal',
        },
        global: {
          components: { VTextField },
        },
      });

      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.props('density')).toBe('comfortable');
    });

    it('applies spacious size', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          size: 'spacious',
        },
        global: {
          components: { VTextField },
        },
      });

      const vTextField = wrapper.findComponent(VTextField);
      expect(vTextField.props('density')).toBe('comfortable');
      expect(wrapper.classes()).toContain('app-input--spacious');
    });
  });

  describe('Props - Label, Placeholder, Hint', () => {
    it('passes label prop to input', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          label: 'Email Address',
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.findComponent(VTextField).props('label')).toBe('Email Address');
    });

    it('passes placeholder prop to input', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          placeholder: 'Enter your email',
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.findComponent(VTextField).props('placeholder')).toBe('Enter your email');
    });

    it('passes hint prop to input', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          hint: 'Help text here',
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.findComponent(VTextField).props('hint')).toBe('Help text here');
    });
  });

  describe('Props - Disabled State', () => {
    it('passes disabled prop to input', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          disabled: true,
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.findComponent(VTextField).props('disabled')).toBe(true);
    });
  });

  describe('Props - Error State', () => {
    it('passes error prop to input', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
          error: true,
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.findComponent(VTextField).props('error')).toBe(true);
    });
  });

  describe('Props - Select-specific', () => {
    it('passes items prop to VSelect', () => {
      const items = [
        { title: 'Option 1', value: 1 },
        { title: 'Option 2', value: 2 },
      ];

      const wrapper = mount(AppInput, {
        props: {
          type: 'select',
          modelValue: null,
          items,
        },
        global: {
          components: { VSelect },
        },
      });

      expect(wrapper.findComponent(VSelect).props('items')).toEqual(items);
    });

    it('passes multiple prop to VSelect', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'select',
          modelValue: [],
          items: [
            { title: 'Option 1', value: 1 },
            { title: 'Option 2', value: 2 },
          ],
          multiple: true,
        },
        global: {
          components: { VSelect },
        },
      });

      expect(wrapper.findComponent(VSelect).props('multiple')).toBe(true);
    });
  });

  describe('Props - Textarea-specific', () => {
    it('passes rows prop to VTextarea', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'textarea',
          modelValue: '',
          rows: 5,
        },
        global: {
          components: { VTextarea },
        },
      });

      expect(wrapper.findComponent(VTextarea).props('rows')).toBe(5);
    });
  });

  describe('Vuetify Defaults Inheritance', () => {
    it('inherits rounded prop from Vuetify defaults', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.findComponent(VTextField).props('rounded')).toBe('lg');
    });

    it('inherits density from Vuetify defaults', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.findComponent(VTextField).props('density')).toBe('comfortable');
    });
  });

  describe('No Inline Styles', () => {
    it('does not use inline styles in AppInput root element', () => {
      const wrapper = mount(AppInput, {
        props: {
          type: 'text',
          modelValue: '',
        },
        global: {
          components: { VTextField },
        },
      });

      // Check AppInput's root element has no inline styles
      const rootElement = wrapper.element as HTMLElement;
      expect(rootElement.getAttribute('style')).toBeNull();
    });
  });

  describe('TypeScript Interface', () => {
    it('accepts AppInputProps interface', () => {
      // This is a compile-time check; at runtime, we verify props are accepted
      const wrapper = mount(AppInput, {
        props: {
          type: 'text' as const,
          modelValue: 'test',
          variant: 'outlined' as const,
          size: 'normal' as const,
          label: 'Test Label',
          placeholder: 'Test Placeholder',
          disabled: false,
          error: false,
          hint: 'Test hint',
        },
        global: {
          components: { VTextField },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });
});
