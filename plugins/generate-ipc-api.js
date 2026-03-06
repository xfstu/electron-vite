import { routeManifest } from "../src/main/ipc/router"
import fs from "fs"

let code = `export const ipc = {\n`

for (const app in routeManifest) {

  code += ` ${app}:{\n`

  for (const controller in routeManifest[app]) {

    code += `  ${controller}:{\n`

    for (const fn of routeManifest[app][controller]) {

      const route = `${app}/${controller}/${fn}`

      code += `
        ${fn}:(...args:any[])=>{
          return window.api.ipc("${route}",...args)
        },
      `
    }

    code += `  },\n`
  }

  code += ` },\n`
}

code += `}`

fs.writeFileSync("src/renderer/ipc-api.ts", code)