import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  ipc: {
    send: (route: string, ...args: any[]) => {
      return ipcRenderer.invoke('ipc:call', route, ...args)
    },
    on(channel: string, callback: (...args: any[]) => void) {
      const handler = (_: any, ...args: any) => callback(...args)
      ipcRenderer.on(`auto-router-send:${channel}`, handler)

      // 返回取消监听函数（很关键）
      return () => ipcRenderer.removeListener(`auto-router-send:${channel}`, handler)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
