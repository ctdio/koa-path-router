const RadixRouter = require('radix-router');
const assert = require('assert')

const { METHODS } = require('http')

const RouteHandler = require('./RouteHandler')

/**
 * Helper function for asserting that the given middleware are functions
 */
function assertMiddlewareFuncs (middleware) {
  for (const func of middleware) {
    assert(typeof func === 'function', 'Route middleware must be a function')
  }
}

class Router {
  /**
   * @constructor
   *
   * @param { Array<Function> } options.middleware - The middleware functions
   * to add to the router
   */
  constructor (options) {
    const {
      middleware
    } = options || {}

    this._router = new RadixRouter()

    if (middleware) {
      assertMiddlewareFuncs(middleware)
    }

    this._middleware = middleware || []
  }

  /**
   * Registers a route
   *
   * @param { String } routeData.path - the path used to describe the route
   * @param { String } routeData.method - the method for the route
   * @param { Array<Functions> } routeData.middleware - the middleware functions to add for the route
   * @param { Function } routeData.handler - the route's handler function
   */
  register (routeData) {
    assert(routeData, 'An object specifying route data must be provided')

    const { path, middleware, handler } = routeData
    let handlerFuncs

    assert(path, 'The route\'s path must be specified')
    assert(typeof path === 'string', 'The route\'s path attribute must be a string')

    const method = routeData.method || 'GET'
    assert(METHODS.indexOf(method) !== -1, `Method: "${method}" is not supported`)

    if (middleware) {
      assert(middleware instanceof Array, 'The route\'s middleware must be provided as an array')

      assertMiddlewareFuncs(middleware)
      handlerFuncs = this._middleware.concat(middleware)
    }

    assert(handler, 'Route handler must be provided')
    assert(typeof handler === 'function', 'Route handler must be a function')
    handlerFuncs = handlerFuncs ? handlerFuncs.concat(handler) : this._middleware.concat(handler)

    const router = this._router

    let routeHandler
    let existingRouteData = router.lookup(path)

    if (existingRouteData) {
      routeHandler = existingRouteData.handler
    } else {
      routeHandler = new RouteHandler(path)
    }

    routeHandler.setMethodHandler(method, handlerFuncs)

    router.insert({
      path,
      handler: routeHandler
    })

    return this
  }

  /**
   * Method for adding middleware like the regular koa style
   */
  use (...middleware) {
    assertMiddlewareFuncs(middleware)
    this._middleware = this._middleware.concat(middleware)
  }

  /**
   * @returns function - an async function that can be passed to Koa
   * for handling requests
   */
  getRequestHandler () {
    const self = this
    const router = self._router

    return async function (ctx, next) {
      const middleware = self._middleware
      const { request } = ctx
      const routeData = router.lookup(request.url)

      if (routeData) {
        const { handler, params } = routeData
        ctx.params = params

        await handler.handleRequest(ctx, next)
      } else {
        await next()
      }
    }
  }
}

/**
 * Generate methods for all of Node's supported HTTP methods
 */
for (const method of METHODS) {
  const funcName = method.toLowerCase()
  Router.prototype[funcName] = function (path, ...handlers) {
    this.register({
      path,
      method,
      // treat everything before the last handler as
      // middleware
      // (this won't affect anything in the end)
      middleware: handlers.slice(0, handlers.length - 1),
      handler: handlers[handlers.length - 1]
    })

    return this
  }
}

module.exports = Router
