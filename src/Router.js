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

    assert(typeof routeData.path === 'string', 'The route\'s path attribute must be a string')
    //assert(typeof routeData.handlers === 'array', 'The route\'s handler must be a function')

    const method = routeData.method || 'GET'
    assert(METHODS.indexOf(method) !== -1, `Method: "${method}" is not supported`)

    const router = this._router

    let existingRouteData = router.lookup(path)
    if (existingRouteData) {
      console.log('found path')
      const { handler } = existingRouteData

      console.log(handler)

    } else {
      console.log('Added route handler')
      const handler = new RouteHandler(path)

      handler.addMethodHandler(method, handlers)

      router.insert({
        path,
        handler
      })
    }
  }

  getRequestHandler () {
    const self = this
    const router = self._router

    return async function (ctx, next) {
      console.log('attempting to handle request')
      const middleware = self._middleware
      const { request } = ctx
      console.log(request.url)
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
    console.log('registering', path, method, handlers)
    this.register({
      path,
      method,
      handlers
    })
  }
}

module.exports = Router
