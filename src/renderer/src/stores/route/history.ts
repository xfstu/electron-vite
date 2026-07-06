// store/history.ts
import { defineStore } from 'pinia'
import type { Router } from 'vue-router'

export interface HistoryItem {
  fullPath: string
  title: string
}

export const useRouterHistoryStore = defineStore('router:history', {
  state: () => ({
    history: [] as HistoryItem[],
    store: [
      { fullPath: '', title: '' }
    ]
  }),
  actions: {
    push(item: HistoryItem) {
      this.history.push(item)
      sessionStorage.setItem('route-history', JSON.stringify(this.history))
      this.store = this.history
    },
    pop() {
      this.history.pop()
      sessionStorage.setItem('route-history', JSON.stringify(this.history))
      this.store = this.history
    },
    load() {
      const data = JSON.parse(sessionStorage.getItem('route-history') as string) ?? this.store
      if (data) this.history = data
    },
    goBack(router: Router, defaultPath = '/') {
      if (this.history.length > 1) {
        this.pop()
        const last = this.history[this.history.length - 1] as HistoryItem
        router.push(last.fullPath)
      } else {
        router.push(defaultPath)
      }
    },
    clear() {
      this.history = []
      this.store = []
      sessionStorage.removeItem('route-history')
    }
  }
})
