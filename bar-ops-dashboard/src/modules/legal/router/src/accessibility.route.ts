import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/accessibility',
  name: 'accessibility-statement',
  component: () => import('@legal/views/AccessibilityStatementView.vue'),
  meta: {
    isPublic: true,
    title: 'הצהרת נגישות – KICK',
    description:
      'הצהרת הנגישות של KICK שירותי בר בע"מ — רמת הנגישות, ההתאמות שבוצעו ודרכי פנייה לרכז הנגישות.',
  },
}

export default route
