import sendRenderer from "@main/ipc/sendRenderer"

export function test(event, ...args: any[]) {
  console.log(args)
  sendRenderer.send('test', args)
  return 'okk'
}