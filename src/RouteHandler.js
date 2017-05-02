class RouteHandler {
  constructor (path) {
    this._path = path
    this._handlers = {}
  }

  setMethodHandler (method, handlers) {
    this._handlers[method] = handlers
  }

  async handleRequest (ctx, next) {
    const { request } = ctx
    const { method } = request

    const handlerFunctions = this._handlers[method]

    if (handlerFunctions) {
      // start from the last function
      for (let i = handlerFunctions.length - 1; i >= 0; i--) {
        const handler = handlerFunctions[i]
        const currentNextFunc = next
        next = async () => {
          await handler(ctx, currentNextFunc)
        }
      }

    }
    if (next) {
      await next()
    }
  }
}

module.exports = RouteHandler
