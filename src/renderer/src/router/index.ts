import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
  // Use memory history for Electron (no URL bar needed)
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { title: 'Dashboard', icon: 'dashboard' }
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('../views/History.vue'),
      meta: { title: 'History', icon: 'history' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
      meta: { title: 'Settings', icon: 'settings' }
    },
    {
      path: '/ai-test',
      name: 'ai-test',
      component: () => import('../views/AITest.vue'),
      meta: { title: 'AI Test', icon: 'science' }
    }
  ]
})

export default router
