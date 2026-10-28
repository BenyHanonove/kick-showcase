// Import testing libraries
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
// Import components
import AppDialog from '@shared/components/dialogs/AppDialog.vue';
// Import theme config
import { vuetify } from '../../../config/theme';
// Import Vue APIs
import { nextTick } from 'vue';

describe('AppDialog', () => {
  let wrapper: VueWrapper | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    document.body.innerHTML = '';
  });

  describe('Renders Dialog Types', () => {
    it('renders info dialog type by default', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          title: 'מידע',
          message: 'הודעת מידע כלשהי'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('מידע');
      expect(bodyText).toContain('הודעת מידע כלשהי');
      expect(bodyText).toContain('סגור');
    });

    it('renders confirm dialog type with cancel and confirm buttons', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'confirm',
          title: 'אישור פעולה',
          message: 'האם אתה בטוח?',
          confirmText: 'כן',
          cancelText: 'לא'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('אישור פעולה');
      expect(bodyText).toContain('האם אתה בטוח?');
      expect(bodyText).toContain('כן');
      expect(bodyText).toContain('לא');
    });

    it('renders form dialog type with slot content', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'form',
          title: 'טופס חדש'
        },
        slots: {
          default: '<div class="test-form-field">שדה בדיקה</div>'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('טופס חדש');
      expect(bodyText).toContain('שדה בדיקה');
      expect(document.querySelector('.test-form-field')).not.toBeNull();
    });

    it('renders delete dialog type with slide-to-confirm pattern', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'delete',
          title: 'אישור מחיקה',
          itemName: 'פריט בדיקה'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const bodyText = document.body.textContent || '';
      expect(bodyText).toContain('אישור מחיקה');
      expect(bodyText).toContain('פריט בדיקה');
      expect(document.querySelector('.slide-track')).not.toBeNull();
      expect(document.querySelector('.slide-handle')).not.toBeNull();
    });
  });

  describe('Events and Actions', () => {
    it('emits close event and sets modelValue false on close click in info dialog', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'info',
          title: 'מידע'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const closeBtn = document.querySelector('.app-button') as HTMLButtonElement;
      expect(closeBtn).not.toBeNull();
      closeBtn.click();
      await nextTick();

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('emits confirm when confirm button clicked in confirm dialog', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'confirm',
          title: 'אישור',
          confirmText: 'Confirm'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const buttons = document.querySelectorAll('.app-button');
      const confirmBtn = Array.from(buttons).find(b => b.classList.contains('app-button--primary')) as HTMLButtonElement;
      expect(confirmBtn).not.toBeUndefined();

      confirmBtn.click();
      await nextTick();

      expect(wrapper.emitted('confirm')).toBeTruthy();
    });

    it('emits cancel and closes when cancel button clicked', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'confirm',
          title: 'אישור',
          cancelText: 'Cancel'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const buttons = document.querySelectorAll('.app-button');
      const cancelBtn = Array.from(buttons).find(b => b.classList.contains('app-button--tertiary')) as HTMLButtonElement;
      expect(cancelBtn).not.toBeUndefined();

      cancelBtn.click();
      await nextTick();

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
      expect(wrapper.emitted('cancel')).toBeTruthy();
    });
  });

  describe('Slide to Delete drag simulations', () => {
    it('simulates slide to delete confirmation', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'delete',
          title: 'מחק',
          itemName: 'פריט'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const handle = document.querySelector('.slide-handle') as HTMLElement;
      const track = document.querySelector('.slide-track') as HTMLElement;
      expect(handle).not.toBeNull();
      expect(track).not.toBeNull();

      // Mock track dimensions
      Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
      track.getBoundingClientRect = () => ({
        width: 300,
        height: 52,
        top: 0,
        left: 0,
        bottom: 52,
        right: 300,
        x: 0,
        y: 0,
        toJSON: () => {}
      });

      const downEvent = new PointerEvent('pointerdown', { clientX: 4, bubbles: true });
      handle.dispatchEvent(downEvent);
      await nextTick();

      const moveEvent = new PointerEvent('pointermove', { clientX: 280, bubbles: true });
      window.dispatchEvent(moveEvent);
      await nextTick();

      const upEvent = new PointerEvent('pointerup', { bubbles: true });
      window.dispatchEvent(upEvent);
      await nextTick();

      expect(wrapper.emitted('confirm')).toBeTruthy();
    });

    it('snaps back when drag is incomplete', async () => {
      wrapper = mount(AppDialog, {
        props: {
          modelValue: true,
          type: 'delete',
          title: 'מחק',
          itemName: 'פריט'
        },
        global: {
          plugins: [vuetify]
        },
        attachTo: document.body
      });

      await nextTick();

      const handle = document.querySelector('.slide-handle') as HTMLElement;
      const track = document.querySelector('.slide-track') as HTMLElement;
      expect(handle).not.toBeNull();
      expect(track).not.toBeNull();

      Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
      track.getBoundingClientRect = () => ({
        width: 300,
        height: 52,
        top: 0,
        left: 0,
        bottom: 52,
        right: 300,
        x: 0,
        y: 0,
        toJSON: () => {}
      });

      const downEvent = new PointerEvent('pointerdown', { clientX: 4, bubbles: true });
      handle.dispatchEvent(downEvent);
      await nextTick();

      const moveEvent = new PointerEvent('pointermove', { clientX: 100, bubbles: true });
      window.dispatchEvent(moveEvent);
      await nextTick();

      const upEvent = new PointerEvent('pointerup', { bubbles: true });
      window.dispatchEvent(upEvent);
      await nextTick();

      expect(wrapper.emitted('confirm')).toBeFalsy();
    });
  });
});
