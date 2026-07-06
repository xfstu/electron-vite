import { app } from "electron";
global.config = JSON.parse(process.env.MYENV || '{}')
app.setName(global.config.appName || 'xfstu')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-zero-copy')
app.commandLine.appendSwitch('ignore-gpu-blocklist')