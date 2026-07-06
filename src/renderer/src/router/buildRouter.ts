import { type RouteRecordRaw, RouterView } from 'vue-router'
import { h } from 'vue'

type MetaMap = Record<string, any>

function createRouterViewWrapper(name: string) {
  return {
    name: name + ':routerViewWrapper',
    render: () => h(RouterView),
  }
}
function pathToName(path: string) {
  return path.replace(/^\//, '').replace(/\//g, ':')
}

// page.json 格式: [{"page":"login/index","meta":{"title":"登录"}}]
type PageConfig = { page: string; meta: any }

function loadPageConfig(): Record<string, any> {
  try {
    const modules = import.meta.glob('/src/views/page.json', { eager: true })
    const mod = Object.values(modules)[0] as { default?: PageConfig[] } | undefined
    const configs: PageConfig[] = (mod?.default ?? mod ?? []) as PageConfig[]
    const map: Record<string, any> = {}
    configs.forEach(cfg => {
      if (cfg.page) {
        map[cfg.page] = cfg.meta ?? {}
      }
    })
    return map
  } catch {
    return {}
  }
}


function buildRoutes(): RouteRecordRaw[] {
  const viewModules = import.meta.glob('/src/views/**/*.vue')
  const metaModules = import.meta.glob('/src/views/**/meta.json', { eager: true })
  const pageConfigMap = loadPageConfig()
  const metaDirMap: Record<string, MetaMap> = {}
  Object.entries(metaModules).forEach(([p, mod]) => {
    const dir = p.replace(/\/meta\.json$/, '')
    const data = (mod as any).default ?? mod
    metaDirMap[dir] = data as MetaMap
  })

  type DirNode = {
    dirs: Record<string, DirNode>
    files: Record<string, () => Promise<any>>
  }
  const root: DirNode = { dirs: {}, files: {} }

  Object.entries(viewModules).forEach(([p, imp]) => {
    const rel = p.replace('/src/views/', '')
    const parts = rel.split('/')
    const file = parts.pop() as string
    const base = file.replace(/\.vue$/, '')
    let cur = root
    parts.forEach(seg => {
      cur.dirs[seg] ||= { dirs: {}, files: {} }
      cur = cur.dirs[seg]
    })
    cur.files[base] = imp as () => Promise<any>
  })

  function resolveMeta(dirStack: string[], key: string): any {
    // meta.json 优先级最高（目录级更具体）
    const dirPath = '/src/views' + (dirStack.length ? '/' + dirStack.join('/') : '')
    const map = metaDirMap[dirPath]
    if (map?.[key]) {
      return map[key]
    }
    // 回退到 page.json
    const pagePath = [...dirStack, key].join('/')
    return pageConfigMap[pagePath] ?? {}
  }

  function makeDirRoute(dirName: string, node: DirNode, dirStack: string[]): RouteRecordRaw {
    const isTopLevel = dirStack.length === 0;
    const currentPath = isTopLevel ? `/${dirName}` : dirName;
    const fullPathForName = '/' + [...dirStack, dirName].join('/');
    const name = pathToName(fullPathForName);

    const fileKeys = Object.keys(node.files);
    const dirKeys = Object.keys(node.dirs);
    const hasIndex = fileKeys.map(fileKey => fileKey.toLowerCase()).includes('index');
    const hasSubDirs = dirKeys.length > 0;
    const hasOtherFiles = fileKeys.filter(k => k.toLowerCase() !== 'index').length > 0;
    const children: RouteRecordRaw[] = [];

    // 1. 递归处理所有子目录
    dirKeys.forEach(childName => {
      // children.push(makeDirRoute(childName, node.dirs[childName], [...dirStack, dirName]));
      children.push(makeDirRoute(childName, node.dirs[childName]!, [...dirStack, dirName]));
    });

    let parentComponent: any;

    // --- 核心逻辑判断 ---
    if (hasIndex && hasOtherFiles) {
      /**
       * 场景 1：有 index.vue/Index.vue，并且还有其他 .vue 文件。
       * 约定：父级作为 RouterView 容器，所有 .vue 文件作为子路由
       */
      parentComponent = createRouterViewWrapper(name);
      fileKeys.forEach(k => {
        children.push({
          path: k,
          name: pathToName(fullPathForName + '/' + k),
          component: node.files[k],
          meta: resolveMeta([...dirStack, dirName], k)
        } as RouteRecordRaw);
      });
    } else if (hasIndex && !hasOtherFiles) {
      /**
       * 场景 2：只有 index.vue/Index.vue（可能有子文件夹）。
       * 约定：index.vue 担任父级组件（Layout角色），子路由不含 index
       */
      parentComponent = node.files['index'] || node.files['Index'];
    } else {
      /**
       * 场景 3：没有 index.vue/Index.vue。
       * 约定：父级作为 RouterView 容器，所有 .vue 文件作为子路由
       */
      parentComponent = createRouterViewWrapper(name);
      fileKeys.forEach(k => {
        children.push({
          path: k,
          name: pathToName(fullPathForName + '/' + k),
          component: node.files[k],
          meta: resolveMeta([...dirStack, dirName], k)
        } as RouteRecordRaw);
      });
    }

    return {
      path: currentPath,
      name: 'root:' + name,
      component: parentComponent,
      children: children.length ? children : [],
      meta: resolveMeta(dirStack, dirName)
    } as RouteRecordRaw;
  }

  const routes: RouteRecordRaw[] = []

  Object.entries(root.files).forEach(([fileName, imp]) => {
    routes.push({
      path: '/' + fileName,
      name: 'root:' + pathToName(fileName),
      component: imp,
      meta: resolveMeta([], fileName)
    })
  })

  Object.entries(root.dirs).forEach(([dirName, node]) => {
    routes.push(makeDirRoute(dirName, node, []))
  })

  return routes
}

export const autoRoutes = buildRoutes()
