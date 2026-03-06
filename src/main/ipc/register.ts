import { ipcMain } from "electron"
import { dispatch } from "./dispatcher"

export function registerIPC() {
  ipcMain.handle("ipc:call", async (event, route: string, ...args: any[]) => {
    try {
      return await dispatch(route, event, args)
    } catch (e: any) {
      return {
        error: true,
        message: e.message
      }
    }

  })

}