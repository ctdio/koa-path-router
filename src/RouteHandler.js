class RouteHandler {
  constructor (path) {
    this._path = path
    this.handlers = {}
  }

  setMethodHandler (method, handlers) {
    this.handlers[method] = handlers
  }

  async handleRequest (ctx, next) {
    const { request } = ctx
    const { method } = request

    const handlerFunctions = this.handlers[method]
    let index = 0

    let nextFunc = next

    // start from the last function
    for (let i = handlerFunctions.length - 1; i >= 0; i--) {
      const handler = handlerFunctions[i]
      const currentNextFunc = nextFunc
      nextFunc = async () => {
        await handler(ctx, currentNextFunc)
      }
    }

    await nextFunc()
  }
}

module.exports = RouteHandler
