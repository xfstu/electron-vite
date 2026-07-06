import winManager from "../utils/WindowManager"

function send(id: string, value: any = null, win: Electron.BrowserWindow | null | string = null) {
  let window: Electron.BrowserWindow | null | undefined
  if (typeof win === 'string' || win === null) {
    window = winManager.getWindow(win || 'main')
  }
  if (!window) {
    throw new Error('未找到窗口')
  }
  window.webContents.send('auto-router-send:' + id, value)
}

function sendAll(id: string, value: any = null) {
  const windows = winManager.getWindows()
  for (const window of windows) {
    window.webContents.send('auto-router-send:' + id, value)
  }
}
export default {
  send
}