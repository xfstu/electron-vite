import { routes } from "./router"
import { compiledMiddleware, getMiddlewareInstance } from "./middleware.loader"

function getMiddlewares(route: string) {
  const mws: any[] = []
  for (const config of compiledMiddleware) {
    if (config.matcher(route)) {
      for (const mw of config.middleware) {
        mws.push(getMiddlewareInstance(mw))
      }
    }
  }
  return mws
}

export async function dispatch(
  route: string,
  event: Electron.IpcMainInvokeEvent,
  args: any[]
) {
  const controller = routes[route]
  if (!controller) {
    throw new Error(`IPC route not found: ${route}`)
  }
  const ctx = {
    route,
    event,
    args
  }
  const middlewares = getMiddlewares(route)
  let index = -1
  async function next(): Promise<any> {
    index++
    if (index < middlewares.length) {
      const mw = middlewares[index]
      if (mw.before) {
        return mw.before(ctx, next)
      }
      return next()
    }

  }
  await next()
  let result = await controller(event, ...ctx.args)
  for (const mw of middlewares.reverse()) {
    if (mw.after) {
      result = await mw.after(ctx, result)
    }
  }
  return result
}