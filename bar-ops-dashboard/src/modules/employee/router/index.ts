import type { RouteRecordRaw } from 'vue-router'
import employeesRoute from './src/employees.route'
import pendingRoute from './src/pending.route'
import selfRegisterRoute from './src/self-register.route'
import selfUpdateRoute from './src/self-update.route'
import employeeDetailsRoute from './src/employee-details.route'
import templatesRoute from './src/templates.route'
import rateRoute from './src/rate.route'

const employeeRoutes: RouteRecordRaw[] = [
  {
    path: '/employees',
    component: () => import('@shared/components/layout/AppLayout.vue'),
    meta: { isPublic: false },
    children: [employeesRoute, pendingRoute, employeeDetailsRoute, templatesRoute, rateRoute],
  },
  selfRegisterRoute,
  selfUpdateRoute,
]

export default employeeRoutes
