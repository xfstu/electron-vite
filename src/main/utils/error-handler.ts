/**
 * 错误处理模块
 * 必须在所有其他本地模块之前被 import，确保处理器在依赖模块加载前注册。
 *
 * ESM 静态 import 按声明顺序、深度优先解析模块图：
 *   index.ts: import './error-handler' → 先执行本模块 → 注册 process.on
 *   index.ts: import './init'          → 后执行 init.ts   → 顶层 throw 可被捕获
 */
import { app } from 'electron'
import Logger from './Logger'

const logger = new Logger()
logger.setOptions({ filename: 'error.log', console: true })
// 未捕获异常
process.on('uncaughtException', (err) => {
  logger.error('[uncaughtException]', err)
})

// Promise 未处理
process.on('unhandledRejection', (reason) => {
  logger.error('[unhandledRejection]', reason)
})

// 多个 Promise 错误
process.on('multipleResolves', (type, promise, value) => {
  logger.error('[multipleResolves]', type, value)
})

// Electron 渲染进程崩溃
app.on('render-process-gone', (event, webContents, details) => {
  logger.error('[render-process-gone]', details)
})

// Electron 子进程崩溃
app.on('child-process-gone', (event, details) => {
  logger.error('[child-process-gone]', details)
})
