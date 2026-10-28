import type { RouteRecordRaw } from 'vue-router'

const termsRoute: RouteRecordRaw = {
  path: '/terms',
  name: 'terms-of-use',
  component: () => import('@legal/views/TermsOfUseView.vue'),
  meta: {
    isPublic: true,
    title: 'תנאי שימוש — KICK',
    description: 'תנאי השימוש והתקנון של אתר ומערכת KICK שירותי בר.',
  },
}

export default termsRoute
