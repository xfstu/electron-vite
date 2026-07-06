import { ElectronAPI } from '@electron-toolkit/preload'

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
