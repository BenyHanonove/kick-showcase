import { defineStore } from 'pinia'

export type SnackbarColor = 'success' | 'error' | 'warning' | 'info' | string

export const SnackbarStore = defineStore('snackbar', {
  // Snackbar UI state
  state: () => ({
    show: false,
    message: '',
    color: 'info' as SnackbarColor,
    timeout: 3000,
  }),

  actions: {
    // Show snackbar message
    open(message: string, color: SnackbarColor = 'info', timeout = 3000) {
      this.message = message
      this.color = color
      this.timeout = timeout
      this.show = true
    },

    // Hide snackbar
    close() {
      this.show = false
    },
  },
})
