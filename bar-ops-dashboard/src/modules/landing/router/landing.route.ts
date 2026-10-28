import type { RouteRecordRaw } from 'vue-router'

const landingRoute: RouteRecordRaw = {
  path: '/',
  name: 'landing',
  component: () => import('../views/LandingPageView.vue'),
  meta: {
    isPublic: true,
    title: 'KICK — שירותי בר פרימיום לאירועים והפקות',
    description:
      'KICK מספקת שירותי בר מלאים, מיקסולוגיה מתקדמת, ברמנים מקצועיים וציוד מלא לחתונות, אירועי חברה והפקות ענק בכל הארץ. תפעול לוגיסטי מדויק.',
  },
}

export default landingRoute
