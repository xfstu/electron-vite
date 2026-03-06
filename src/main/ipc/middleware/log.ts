export default class LogMiddleware {

  async before(ctx: any, next: Function) {
    ctx.args[2] = 'middleware log'
    console.log("IPC request:", ctx.route, ctx.args)
    return next()
  }

  async after(ctx: any, result: any) {
    console.log("IPC response:", result)
    return result
  }

}