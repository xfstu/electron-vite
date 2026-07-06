import Logger from "@main/utils/Logger"

declare global {
  var config: {
    appName: string
    isDev: boolean
    NODE_ENV: 'dev' | 'pro',
    database: {
      type: 'sqlite',
      dir: string,
      sqlite: [{
        filename: string,
        pwd: string | null
      }]
    }
    appPath: string
    getPath: (name: 'home' | 'appData' | 'assets' | 'userData' | 'sessionData' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps') => string
    setSetting(name: string, data: any): void;
    getSetting<T = any>(name: string, defaultValue?: any): T
    logger: InstanceType<typeof Logger>
  }
}

export { }