import winManager from "@main/utils/winManager"

export function test(event, args: any) {
  console.log(args)
  const win = winManager.getWindow('main')
  if (win) {
    //像此窗口的渲染进程发送消息
    win.send('ping', args)
  }
  return 'okk'
}