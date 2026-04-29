import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import GeneradorView from '../views/GeneradorView.vue'
import RunView from '../views/RunView.vue'
import DataView from '../views/DataView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/generador', name: 'generador', component: GeneradorView },
    { path: '/run', name: 'run', component: RunView },
    { path: '/data', name: 'data', component: DataView },
  ],
})

export default router
