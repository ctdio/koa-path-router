class RouteHandler {
  /**
   * @constructor
   *
   * @param { String } path - the path of the route
   */
  constructor (path) {
    this._path = path
    this._handlers = {}
  }

  /**
   * Register handler functions for a method
   *
   * @param { String } method - the method to handle
   * @param { Array<Function> } handlers - the handler functions to use
   */
  setMethodHandler (method, handlers) {
    this._handlers[method] = handlers
  }

  /**
   * Handle requests
   *
   * @param { Object } ctx - the context passed in by koa
   * @param { Function } next - the next function in the chain
   */
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
