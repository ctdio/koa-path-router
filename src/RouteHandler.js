class RouteHandler {
  /**
   * @constructor
   */
  constructor () {
    this._handlers = {}
  }

  /**
   * Register handler functions for a method
   *
   * @param { String } method - the method to handle
   * @param { Function } handler - the handler functions to use
   */
  setMethodHandler (method, handler) {
    this._handlers[method] = handler
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

    const handlerFunc = this._handlers[method]
    return handlerFunc(ctx, next)
  }
}

module.exports = RouteHandler
