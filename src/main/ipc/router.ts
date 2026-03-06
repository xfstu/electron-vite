const modules = import.meta.glob(
  "/src/main/ipc/apps/**/controller/*.ts",
  { eager: true }
)

export const routes: Record<string, Function> = {}
export const routeManifest: Record<string, any> = {}

for (const path in modules) {

  const mod: any = modules[path]

  const match = path.match(/apps\/(.*?)\/controller\/(.*?)\.ts/)
  if (!match) continue

  const app = match[1]
  const controller = match[2]

  if (!routeManifest[app]) routeManifest[app] = {}
  if (!routeManifest[app][controller]) routeManifest[app][controller] = []

  for (const fnName in mod) {

    const route = `${app}/${controller}/${fnName}`

    routes[route] = mod[fnName]
    routeManifest[app][controller].push(fnName)

  }

}