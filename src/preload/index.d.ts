import { ElectronAPI } from '@electron-toolkit/preload'

interface ipcResponse<T> {
  ok: boolean
  data: T
  msg: string
  total?: number
}
type ipcRoute = [
]
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ipc: {
        send: (route: string, ...args: any[]) => any
        on: (channel: string, callback: (...args: any[]) => void) => () => void
      }
    }
  }
}
