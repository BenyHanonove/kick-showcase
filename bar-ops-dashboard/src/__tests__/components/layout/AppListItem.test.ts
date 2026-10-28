import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppListItem from '@shared/components/layout/AppListItem.vue';

describe('AppListItem', () => {
  it('renders title and prepends/appends icons correctly', () => {
    const wrapper = mount(AppListItem, {
      props: {
        title: 'פריט בדיקה',
        prependIcon: 'mdi-plus',
        appendIcon: 'mdi-chevron-right',
      }
    });

    const listItem = wrapper.find('.v-list-item');
    expect(listItem.exists()).toBe(true);
    expect(listItem.text()).toContain('פריט בדיקה');
    expect(listItem.classes()).toContain('app-list-item');
  });

  it('renders slots correctly', () => {
    const wrapper = mount(AppListItem, {
      slots: {
        default: 'תוכן פנימי',
      }
    });

    expect(wrapper.text()).toContain('תוכן פנימי');
  });

  it('emits click event when clicked', async () => {
    const wrapper = mount(AppListItem);
    await wrapper.find('.v-list-item').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
    expect(wrapper.emitted('click')?.[0]).toBeTruthy();
  });

  it('does not emit click event when disabled', async () => {
    const wrapper = mount(AppListItem, {
      props: {
        disabled: true,
      }
    });
    await wrapper.find('.v-list-item').trigger('click');
    expect(wrapper.emitted('click')).toBeFalsy();
  });
});
