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
        send: <T = any> (route: string | ipcRoute, data?: any) => Promise<ipcResponse<T>>,
        on: (channel, callback) => void
      }
    }
  }
}
