const RadixRouter = require('radix-router');
const assert = require('assert')

const { METHODS } = require('http')

const RouteHandler = require('./RouteHandler')

class Router {
  constructor () {
    this._router = new RadixRouter()
    this._middleware = []
  }

  register (routeData) {
    assert(routeData, 'And object specifying route data must be provided')

    const { path, handlers } = routeData

    assert(typeof path === 'string', 'The route\'s path attribute must be a string')
    assert(routeData.handlers instanceof Array, 'The route\'s handlers must be provided as an array')

    const method = routeData.method || 'GET'
    assert(METHODS.indexOf(method) !== -1, `Method: "${method}" is not supported`)

    const router = this._router
    const handlerFuncs = this._middleware.concat(handlers)

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
  }

  use (...handlers) {
    this._middleware = this._middleware.concat(handlers)
  }

  getRequestHandler () {
    const self = this
    const router = self._router

    return async function (ctx, next) {
      const middleware = self._middleware
      const { request } = ctx
      let start = Date.now()
      const routeData = router.lookup(request.url)

      if (routeData) {
        const { handler } = routeData

        await handler.handleRequest(ctx, next)
      } else {
        await next()
      }
    }
  }
}

for (const method of METHODS) {
  const funcName = method.toLowerCase()
  Router.prototype[funcName] = function (path, ...handlers) {
    this.register({
      path,
      method,
      handlers
    })
  }
}

module.exports = Router
