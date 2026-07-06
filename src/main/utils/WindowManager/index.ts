const map = new Map<string, Electron.BrowserWindow>()

function getWindow(id: string) {
  return map.get(id)
}

function setWindow(id: string, window: Electron.BrowserWindow) {
  map.set(id, window)
}

function removeWindow(id: string) {
  const win = map.get(id)
  win?.close()
  map.delete(id)
}

function getWindows() {
  return Array.from(map.values())
}

export default {
  getWindow,
  setWindow,
  removeWindow,
  getWindows
}