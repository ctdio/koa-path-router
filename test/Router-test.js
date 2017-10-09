const { expect } = require('chai')
const Router = require('../src/Router')
const { METHODS } = require('http')

const sinon = require('sinon')

function registerWithError (routeData, error) {
  const router = new Router()
  const registerRoute = router.register.bind(router, routeData)
  expect(registerRoute).to.throw(error)
}

describe('Router', () => {
  let sandbox

  before(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

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

  it('should throw an error when registering routes middleware that is ' +
    'not an array of functions', () => {
    registerWithError({
      path: '/some/path',
      middleware: [ {} ]
    }, /Route middleware must be a function/)
  })

  it('should throw an error when registering route with a handler that ' +
    'is not a function', () => {
    registerWithError({
      path: '/some/path',
      handler: {}
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

    expect(typeof handler._handlers[method]).to.equal('function')
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

    expect(typeof handler._handlers['GET']).to.equal('function')
  })

  it('should set multiple middleware if supplied as an array to constructor', () => {
    const middleware = [
      async () => {},
      async () => {},
      async () => {}
    ]

    const router = new Router({
      middleware
    })

    expect(middleware).to.equal(router._middleware)
  })

  it('should append middleware added via "use" to existing middleware', () => {
    const middlewareFuncA = async (ctx, next) => next()
    const middlewareFuncB = async (ctx, next) => next()
    let middleware = [
      middlewareFuncA
    ]

    const router = new Router({ middleware })
    router.use(middlewareFuncB)

    expect(router._middleware[0]).to.equal(middlewareFuncA)
    expect(router._middleware[1]).to.equal(middlewareFuncB)
  })

  it('should be able to add handlers via convenience methods', async () => {
    const router = new Router()
    const internalRouter = router._router

    const path = '/some/random/path'

    for (const method of METHODS) {
      let handlerACalled, handlerBCalled

      const handlerFuncs = [
        async (ctx, next) => {
          handlerACalled = true
          await next()
        },
        async () => {
          handlerBCalled = true
        }
      ]

      router[method.toLowerCase()](path, ...handlerFuncs)

      const { handler } = internalRouter.lookup(path)
      const handlerFn = handler._handlers[method]

      await handlerFn({})

      expect(handlerACalled).to.equal(true)
      expect(handlerBCalled).to.equal(true)
    }
  })

  it('should add middleware to the beginning of handlers', async () => {
    const router = new Router()
    const internalRouter = router._router
    let handlerCalled = false
    const handlerFunc = async () => {
      handlerCalled = true
    }

    let middlewareACalled = false
    let middlewareBCalled = false

    const middlewareFuncs = [
      async (ctx, next) => {
        middlewareACalled = true
        expect(middlewareBCalled).to.equal(false)
        await next()
      },
      async (ctx, next) => {
        middlewareBCalled = true
        expect(middlewareACalled).to.equal(true)
        await next()
      }
    ]

    router.use(...middlewareFuncs)

    const path = '/some/random/path'
    router.get(path, handlerFunc)

    const { handler } = internalRouter.lookup(path)
    const routeHandler = handler._handlers['GET']

    await routeHandler({})

    expect(middlewareACalled).to.equal(true)
    expect(middlewareBCalled).to.equal(true)
    expect(handlerCalled).to.equal(true)
  })

  it('should add middleware to the beginning of handlers if ' +
    'middleware is supplied to constructor', async () => {
    let handlerCalled = false
    const handlerFunc = async () => {
      handlerCalled = true
    }

    let middlewareACalled = false
    let middlewareBCalled = false

    const middleware = [
      async (ctx, next) => {
        middlewareACalled = true
        expect(middlewareBCalled).to.equal(false)
        await next()
      },
      async (ctx, next) => {
        middlewareBCalled = true
        expect(middlewareACalled).to.equal(true)
        await next()
      }
    ]

    const router = new Router({ middleware })

    const path = '/some/random/path'
    router.get(path, handlerFunc)

    const handler = router.getRequestHandler()

    await handler({
      request: {
        url: path,
        method: 'GET'
      }
    })

    expect(middlewareACalled).to.equal(true)
    expect(middlewareBCalled).to.equal(true)
    expect(handlerCalled).to.equal(true)
  })
})
