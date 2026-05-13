const map = new Map<string, MyBrowserWindow>()

type MyBrowserWindow = Electron.BrowserWindow & {

  /**
   * 给窗口发送消息
   * @param router 路由，推荐用冒号分隔
   * @param value 要发送的值
   * @returns 
   */
  send: (router: string, value: any) => void
}
function getWindow(id: string) {
  return map.get(id)
}

function getAllWindow() {
  const all: { id: string, win: MyBrowserWindow }[] = []
  map.forEach((value, key) => {
    all.push({ id: key, win: value })
  })
  return all
}

function setWindow(id: string, window: Electron.BrowserWindow) {
  (window as MyBrowserWindow).send = (router, value) =>
    window.webContents.send('auto-router-send:' + router, value)
  map.set(id, window as MyBrowserWindow)
}


function removeWindow(id: string) {
  const win = map.get(id)
  win?.close()
  map.delete(id)
}

export default {
  getWindow,
  setWindow,
  removeWindow,
  getAllWindow
}