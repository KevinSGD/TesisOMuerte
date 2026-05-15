import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import SchedulerView from '../views/SchedulerView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/scheduler', name: 'scheduler', component: SchedulerView },
  ],
})

export default router
