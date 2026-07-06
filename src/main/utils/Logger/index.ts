import { app } from 'electron'
import fs from 'fs'
import path from 'path'

interface optionsType {
  dir?: string,
  filename?: string,
  auto?: boolean
  console?: boolean
}
class Logger {
  private filePath = ''
  private today = ''
  private logLevel: string[] = []
  private prefix = ''
  private options: Required<optionsType> = {
    dir: app.getPath('userData'),
    filename: 'main.log',
    auto: true,
    console: true,
  }
  constructor() {
    this.formatDateTime()
    this.setOptions()
  }

  public setOptions(options?: optionsType) {
    this.options = {
      ...this.options,
      ...options
    }
  }
  public setPrefix(value: string) {
    this.prefix = value
  }
  private formatDateTime() {
    const date = new Date();
    this.today = date.toISOString().slice(0, 10).replace(/-/g, '');
    const pad = (num) => String(num).padStart(2, '0');
    const datetime = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    return datetime
  }
  public getToday(): string {
    return this.today
  }

  public showLevel(level: string) {
    this.logLevel = level.split(',')
  }

  private updateLogPath() {
    if (this.options?.auto) {
      const logPath = path.join(this.options.dir, 'logs', this.today, this.options.filename)
      this.filePath = path.resolve(logPath)
    }
  }

  private log(level: 'debug' | 'info' | 'error' | 'warn', ...args: any[]) {
    if (this.logLevel.length !== 0 && !this.logLevel.includes(level)) return
    const time = this.formatDateTime();
    this.updateLogPath()
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const prefix = `[${time}] [${level.toUpperCase().padEnd(5)}]${this.prefix ?? ' [' + this.prefix + ']'}`;

    // 控制台保持原样
    if (this.options.console) {
      console[level](prefix, ...args)
    };

    // 文件日志处理
    const parts = args.map(arg => {
      if (arg instanceof Error) {
        // 优先用 stack，没有就用 message + toString
        return arg.stack?.trim() || `${arg.name || 'Error'}: ${arg.message || arg.toString()}`;
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return arg.toString();
        }
      }
      return String(arg);
    });

    const logLine = `${prefix} ${parts.join(' ')}\n`;
    fs.appendFileSync(
      this.filePath,
      logLine,
      'utf8'
    );
  }


  public setPath(logPath: string) {
    this.options.auto = false
    this.filePath = path.resolve(logPath);
    const dir = path.dirname(this.filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
  debug(...args: any[]) { this.log('debug', ...args); }
  info(...args: any[]) { this.log('info', ...args); }
  warn(...args: any[]) { this.log('warn', ...args); }
  error(...args: any[]) { this.log('error', ...args); }
}
export default Logger
export const logger = new Logger()