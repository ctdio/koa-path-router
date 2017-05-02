const { expect } = require('chai')
const Router = require('../src/Router')
const { METHODS } = require('http')

function registerWithError (routeData, error) {
  const router = new Router()
  const registerRoute = router.register.bind(router, routeData)
  expect(registerRoute).to.throw(error)
}

describe('Router', () => {
  it('should throw an error when registering routes without input', () => {
    registerWithError(null, /route data must be provided/)
    registerWithError(undefined, /route data must be provided/)
  })

  it('should throw an error when registering routes without a path', () => {
    registerWithError({
      method: 'POST',
      handlers: [
        async () => {}
      ]
    }, /path must be specified/)
  })

  it('should throw an error when registering routes without an unsupported method', () => {
    registerWithError({
      path: '/some/path',
      method: 'METHODTHATISNOTSUPPORTED',
      handlers: [
        async () => {}
      ]
    }, /not supported/)
  })

  it('should throw an error when registering routes with an empty handlers array', () => {
    registerWithError({
      path: '/some/path',
      handlers: []
    }, /No route handlers specified/)
  })

  it('should throw an error when registering routes with objects ' +
    'other than functions in the handlers array', () => {
    registerWithError({
      path: '/some/path',
      handlers: [ {} ]
    }, /Route handler must be a function/)
  })

  context('with a single handler', () => {
    it('should throw an error if the handler attribute is not a function', () => {
      registerWithError({
        path: '/some/path',
        handler: 'not a function'
      }, /Route handler must be a function/)
    })

    it('should throw an error when registering routes with no ' +
      'handler or handlers specified', () => {
      registerWithError({
        path: '/some/path'
      }, /Route handler must be provided/)
    })
  })

  it('should insert routes into the path router under the correct method', () => {
    const handlerFunc = async () => {}
    const path = '/some/path'
    const method = 'POST'

    const router = new Router()
    router.register({
      path,
      method: 'POST',
      handler: handlerFunc
    })

    const internalRouter = router._router
    const { handler } = internalRouter.lookup(path)

    expect(handler._handlers[method][0]).to.equal(handlerFunc)
  })

  it('should default to setting handlers for the GET method if nothing is provided', () => {
    const handlerFunc = async () => {}
    const path = '/some/path'

    const router = new Router()
    router.register({
      path,
      handler: handlerFunc
    })

    const internalRouter = router._router
    const { handler } = internalRouter.lookup(path)

    expect(handler._handlers['GET'][0]).to.equal(handlerFunc)
  })

  it('should set multiple handlers if supplied as an array', () => {
    const handlers = [
      async () => {},
      async () => {},
      async () => {}
    ]
    const path = '/some/path'

    const router = new Router()
    router.register({
      path,
      handlers: handlers
    })

    const internalRouter = router._router
    const { handler } = internalRouter.lookup(path)
    const registeredHandlers = handler._handlers['GET']

    for (let i = 0; i < handlers.length; i++) {
      expect(handlers[i]).to.equal(registeredHandlers[i])
    }
  })

  it('should be able to add handlers via convenience methods', () => {
    const router = new Router()
    const internalRouter = router._router
    const handlerFuncs = [
      async () => {},
      async () => {}
    ]

    const path = '/some/random/path'

    for (const method of METHODS) {
      router[method.toLowerCase()](path, ...handlerFuncs)

      const { handler } = internalRouter.lookup(path)
      const routeHandlers = handler._handlers[method]

      for (let i = 0; i < handlerFuncs.length; i++) {
        expect(handlerFuncs[i]).to.equal(routeHandlers[i])
      }
    }
  })

  it('should add middleware to the beginning of handlers', () => {
    const router = new Router()
    const internalRouter = router._router
    const handlerFunc = async () => {}
    const middlewareFuncs = [
      async () => {},
      async () => {}
    ]

    router.use(...middlewareFuncs)

    const path = '/some/random/path'
    router.get(path, handlerFunc)

    const { handler } = internalRouter.lookup(path)
    const routeHandlers = handler._handlers['GET']
    for (let i = 0; i < middlewareFuncs.length; i++) {
      expect(middlewareFuncs[i]).to.equal(routeHandlers[i])
    }

    expect(routeHandlers[routeHandlers.length - 1]).to.equal(handlerFunc)
  })

  it('should be able to handle routes via the requestHandler', async () => {
    const router = new Router()
    let handlerCalled = false
    const handlerFunc = async () => {
      handlerCalled = true
    }

    const path = '/some/random/path'
    router.get(path, handlerFunc)

    const handleRequest = router.getRequestHandler()

    const context = {
      request: {
        url: path,
        method: 'GET'
      }
    }

    await handleRequest(context)

    expect(handlerCalled).to.equal(true)
  })
})
