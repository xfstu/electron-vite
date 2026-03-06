import middlewareConfig from "./middleware.config"
import micromatch from "micromatch"

const instances = new Map()

export function getMiddlewareInstance(MW: any) {

  if (!instances.has(MW)) {
    instances.set(MW, new MW())
  }

  return instances.get(MW)

}

export const compiledMiddleware = middlewareConfig.map(c => ({
  matcher: micromatch.matcher(c.url),
  middleware: c.middleware
}))