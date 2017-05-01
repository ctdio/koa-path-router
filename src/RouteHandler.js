class RouteHandler {
  constructor (path) {
    this._path = path
    this.handlers = {}
  }

  addMethodHandler (method, handlers) {
    this.handlers[method] = handlers
  }

  async handleRequest (ctx, next) {
    const { request } = ctx
    const { method } = request

    const handlerFunctions = this.handlers[method]
    let index = 0

    let currentFunc
    let currentNextFunc = next

    // start from the last function to be called
    for (let i = handlerFunctions.length - 1; i >= 0; i--) {
      currentFunc = handlerFunctions[i]
      currentNextFunc = currentFunc.bind(null, ctx, currentNextFunc)
    }

    await currentNextFunc(ctx, next)
  }
}

module.exports = RouteHandler
