import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/privacy-policy',
  name: 'privacy-policy',
  component: () => import('@legal/views/PrivacyPolicyView.vue'),
  meta: {
    isPublic: true,
    title: 'מדיניות פרטיות – KICK',
    description:
      'מדיניות הפרטיות של KICK שירותי בר בע"מ — איזה מידע נאסף, כיצד הוא נשמר ומה הזכויות שלכם.',
  },
}

export default route
