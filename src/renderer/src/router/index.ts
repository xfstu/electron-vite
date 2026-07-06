import { useRouterHistoryStore } from '@renderer/stores/route/history';
import { useRouterStore } from '@renderer/stores/route/router';
import { createRouter, createWebHistory } from 'vue-router'
import { autoRoutes } from './buildRouter';

const routes = [
  { path: '/', redirect: '/index' },
  ...autoRoutes
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
// console.log(autoRoutes)

router.beforeEach((to, from) => {
  // 404 兜底：如果即将进入的路由不存在，则跳转到 404
  if (to.matched.length === 0) {
    return '/404'
  }
})

router.afterEach((to, from) => {
  const meta = { ...to.meta, ...(history.state?.meta || {}) };
  const title = (meta.title as string) || '新页面'
  document.title = title
  const historyStore = useRouterHistoryStore()
  if (from.path.includes('login')) {
    historyStore.clear()
  }
  if (to.path !== '/404') {
    historyStore.load()
    const fromIndex = historyStore.history.findIndex(i => i.fullPath === from.fullPath)
    const toIndex = historyStore.history.findIndex(i => i.fullPath === to.fullPath)
    if (toIndex === -1) {
      // 新跳转 => 前进
      historyStore.push({ fullPath: to.fullPath, title })
    } else if (toIndex < fromIndex) {
      // 回退
      historyStore.pop()
    }

    const useAppConfig = useRouterStore();
    useAppConfig.router = { to, from, router: router as any }
  }

})
export default router
