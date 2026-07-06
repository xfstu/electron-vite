import { app } from "electron"
import * as nodePath from "path"
import DBManager from "./DBManager"
import { logger } from "./Logger"

const appPath = app.isPackaged ? nodePath.dirname(app.getPath("exe")) : app.getAppPath()
const dbManager = new DBManager()
const dbPath = nodePath.join(app.getPath('userData'), 'database', 'Database.db')

function getSetting<T = any>(name: string, defaultValue?: any): T {
  const db = dbManager.open(dbPath)
  const res = db.query<{ value: string }>('select value from setting where name=?', [name])
  if (res) {
    return JSON.parse(res.rows[0].value)
  }
  if (defaultValue) {
    setSetting(name, defaultValue)
  }
  return defaultValue
}

function setSetting(name: string, data: any): void {
  const db = dbManager.open(dbPath)
  db.run(
    'INSERT INTO setting (name, value) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET value = excluded.value;',
    [name, JSON.stringify(data)]
  )
}

export function initSync() {
  global.config = {
    ...global.config,
    isDev: global.config.NODE_ENV === 'dev',
    appPath,
    getPath: (name) => app.getPath(name),
    getSetting,
    setSetting,
    logger
  }

}

export async function initAsync() {

}