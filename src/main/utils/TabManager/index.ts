import { WebContentsView, shell, dialog, session, net, BrowserWindow } from "electron";
import { join, dirname } from "path";
import { clone } from "lodash";
import fs from "fs";


interface viewsType {
  id: string
  url: string
  time: number
  view: WebContentsView
}

class TabManager {
  static instance: TabManager | null = null;
  static mainWindow: BrowserWindow | undefined;
  static baseUrl = null;
  views: viewsType[] = [];
  private activeView: viewsType | BrowserWindow | null = null;
  x = 0;
  y = 41;
  constructor(mainWindow?: BrowserWindow, baseUrl?: string) {
    if (TabManager.instance) {
      return TabManager.instance;
    }
    TabManager.mainWindow = mainWindow;
    TabManager.instance = this;
    // mainWindow.webContents.send('view-info')
  }

  listenMainWindowSize(view: WebContentsView) {
    // 监听窗口大小变化
    if (!TabManager.mainWindow) return
    TabManager.mainWindow.on("resize", () => this.showView(view));
    TabManager.mainWindow.on("maximize", () => this.showView(view));
    TabManager.mainWindow.on("unmaximize", () => this.showView(view));
  }

  showView(view: WebContentsView) {
    // const bounds = TabManager.mainWindow.getBounds(); // 获取窗口大小
    if (!TabManager.mainWindow) return
    const bounds = TabManager.mainWindow.getContentBounds();
    view.setBounds({
      x: this.x,
      y: this.y,
      width: bounds.width,
      height: bounds.height - this.y,
    });
    view.setVisible(true)
    // view.setAutoResize({ width: true, height: true });
  }

  hiddenViewe(view: WebContentsView) {
    // view.setBounds({ x: this.x, y: this.y, width: 0, height: 0 });
    // view.visible = false
    view.setVisible(false)
    // view.webContents
  }


  async createTab(tabInfo) {
    const id = crypto.randomUUID();
    for (let i = 0; i < this.views.length; i++) {
      //隐藏所有页面
      this.hiddenViewe(this.views[i].view);
    }
    let preloadPath;
    //页面是否自带preload
    if (tabInfo.preload) {
      preloadPath = join(tabInfo.preload);
    } else {
      preloadPath = join(__dirname, "../preload/index.js");
    }
    //创建子页面
    const view = new WebContentsView({
      webPreferences: {
        preload: preloadPath,
        sandbox: false,
        webSecurity: true,
        session: session.fromPartition(id),
        additionalArguments: [`--darkMode=`],
        nodeIntegration: false,
      },
    });
    // view.webContents.forcefullyCrashRenderer()
    view.webContents.reloadIgnoringCache();
    const customSession = session.fromPartition(id);

    customSession.protocol.handle("atom", async (request) => {
      const url = new URL(request.url);
      let normalized = url.host + ":" + decodeURIComponent(url.pathname);
      normalized = normalized.split("\\").join("/");
      try {
        return await net.fetch(`file:///${normalized}`);
      } catch (err) {
        return new Response("File not found", { status: 404 });
      }
    });

    function buildHeaders(headerString: string | object) {
      if (!headerString) return {};

      if (typeof headerString === "object") {
        return { ...headerString };
      }
      const headers = {};
      headerString.split(/\r?\n/).forEach(line => {
        const [key, ...rest] = line.split(':');
        if (key && rest.length) {
          headers[key.trim()] = rest.join(':').trim();
        }
      });
      return headers;
    }

    view.webContents.on("will-navigate", (event, url) => {
      event.preventDefault();
      if (url.startsWith("http")) {
        event.preventDefault();
        shell.openExternal(url);
      } else {
        const Url = new URL(url);
        const FilePath = Url.host + ":" + decodeURIComponent(Url.pathname);
        dialog
          .showSaveDialog({
            title: "保存文件",
            defaultPath: FilePath,
          })
          .then((result) => {
            if (result.canceled || !result.filePath) return;
            const destPath = result.filePath;
            const destDir = dirname(destPath);
            // 创建目标目录
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            // 检查源文件是否存在
            if (!fs.existsSync(FilePath)) {
              dialog.showMessageBox({
                type: "error",
                title: "错误提示",
                message: "文件不存在",
              });
              return;
            }
            // 复制文件
            try {
              fs.copyFileSync(FilePath, destPath);
            } catch (err) {
              dialog.showMessageBox({
                type: "error",
                title: "错误提示",
                message: "复制失败",
              });
            }
          });
      }
    });
    let baseUrl;
    if (process.env["ELECTRON_RENDERER_URL"]) {
      baseUrl = process.env["ELECTRON_RENDERER_URL"];
    } else {
      baseUrl = join(__dirname, "../renderer/index.html");
    }
    let loadURL;
    //如果直接传入一个html页面，则直接加载
    if (tabInfo.url.indexOf(".html") !== -1) {
      loadURL = join(tabInfo.url);
    } else if (tabInfo.url.indexOf("http") !== -1) {
      loadURL = tabInfo.url;
    } else {
      //否则使用主进程html，并拼接vue router参数
      loadURL = baseUrl + "#" + tabInfo.url;
    }
    //加载页面
    view.webContents.loadURL(loadURL);

    // view.webContents.loadURL(globalConfg.getResourcesPath() + '/index.html');
    //监听窗口变化，跟随父窗口变化
    this.listenMainWindowSize(view);

    const viewInfo = {
      id,
      ...tabInfo,
      view: view,
    };
    this.views.push(viewInfo);
    this.activeView = viewInfo;

    return new Promise((resolve, reject) => {
      view.webContents.on("dom-ready", () => {
        if (!TabManager.mainWindow) return
        TabManager.mainWindow.contentView.addChildView(view);
        // TabManager.mainWindow.setBrowserView(view)
        const cloneView = clone(viewInfo);

        delete cloneView.view;

        //页面加载完成，显示页面
        this.showView(view);
        if (tabInfo.dev) {
          //如果当前页面需要开启调试
          view?.webContents?.openDevTools();
        }
        // view.webContents.executeJavaScript(`
        //   localStorage.setItem('appId', '${id}');
        // `);
        const views = this.views;
        //Promise完成
        resolve({ status: true, data: JSON.stringify({ viewInfo, views }) });
      });
    });
  }

  findView(view, views) {
    for (let i = 0; i < views.length; i++) {
      if (views[i].url == view.url && views[i].time == view.time) {
        return views[i];
      }
    }
    return null;
  }

  findViewById(id) {
    const views = this.views;
    for (let i = 0; i < views.length; i++) {
      if (views[i].id == id) {
        return views[i];
      }
    }
    return null;
  }

  changeTab(tabInfo: viewsType) {
    if (!TabManager.mainWindow) return
    const views = this.views;
    for (let i = 0; i < views.length; i++) {
      // views[i].view.setBounds({ x: 0, y: 70, width: 0, height: 0 });
      this.hiddenViewe(views[i].view);
      if (tabInfo) {
        if (views[i].url == tabInfo.url && views[i].time == tabInfo.time) {
          // views[i].view.setBounds({ x: 0, y: 70, width: 950, height: 650 });
          this.showView(views[i].view);
          this.activeView = views[i];
        }
      } else {
        this.activeView = TabManager.mainWindow
      }
    }
  }

  async closeTab(view: viewsType) {
    const views = this.views;
    for (let i = 0; i < views.length; i++) {
      if (views[i].url == view.url && views[i].time == view.time) {
        // const ok = await this.canCloseTab(views[i].view);
        // // console.log(ok);
        // if (!ok) {
        //   /*  const choice = dialog.showMessageBoxSync({
        //      type: 'warning',
        //      buttons: ['仍然关闭', '取消'],
        //      defaultId: 1,
        //      cancelId: 1,
        //      message: '此标签页页面有 beforeunload 监听，确定要强制关闭？'
        //    }) 
        //    if (choice !== 0) {
        //      return false
        //    }*/
        //   return false
        // }
        views[i].view.webContents.close();
        if (!TabManager.mainWindow) return
        TabManager.mainWindow.contentView.removeChildView(views[i].view);
        // views[i].view.webContents.destroy();
        views.splice(i, 1);
        return true
      }
    }
    return false
  }

  closeTabAll() {
    for (let i = 0; i < this.views.length; i++) {
      if (!TabManager.mainWindow) return
      TabManager.mainWindow.contentView.removeChildView(this.views[i].view);
      // this.views[i].view.webContents.destroy();
      this.views.splice(i, 1);
    }
  }

  hiddenTab(view: viewsType) {
    if (!view) {
      for (let i = 0; i < this.views.length; i++) {
        // this.views[i].view.setBounds({ x: 0, y: 70, width: 0, height: 0 });
        this.hiddenViewe(this.views[i].view);
      }
      return;
    }
    const views = this.views;
    for (let i = 0; i < views.length; i++) {
      if (views[i].url == view.url && views[i].time == view.time) {
        // views[i].view.setBounds({ x: 0, y: 70, width: 0, height: 0 });
        this.hiddenViewe(views[i].view);
      }
    }
  }

  getTabs() {
    return this.views;
  }

  getActiveView() {
    return this.activeView;
  }

  getMainWindow() {
    return TabManager.mainWindow;
  }

  getView(viewId) {
    return viewId ? this.views : this.views[viewId];
  }
}

// module.exports = TabManager;
export default TabManager;
