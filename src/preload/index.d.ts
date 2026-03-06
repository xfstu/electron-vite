import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      ipc: (route: string, ...args: any[]) => any
    }
  }
}
