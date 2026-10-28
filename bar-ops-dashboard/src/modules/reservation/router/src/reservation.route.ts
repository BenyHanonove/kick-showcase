import type { RouteRecordRaw } from 'vue-router'

const route: RouteRecordRaw = {
  path: '/reserve',
  alias: '/reservation',
  name: 'reservation-landing',
  component: () => import('@reservation/views/ReservationView.vue'),
  meta: {
    isPublic: true,
    title: 'הזמנת בר לאירוע – KICK',
    description:
      'בר מלא לאירוע: אלכוהול, ציוד וצוות ברמנים. משאירים פרטים, מרימים אליכם טלפון וחוזרים עם הצעת מחיר מותאמת.',
  },
}

export default route
