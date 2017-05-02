const RouteHandler = require('../src/RouteHandler')
const { expect } = require('chai')

describe('RouteHandler', () => {
  it('should be able to assign handlers to a method', () => {
    const method = 'GET'
    const handler = new RouteHandler()
    const handlers = [
      async () => {},
      async () => {}
    ]

    handler.setMethodHandler(method, handlers)

    expect(handler._handlers[method]).to.equal(handlers)
  })

  it('should be able to handle requests with multiple handlers ' +
    'if the next function is called', async () => {
    const method = 'GET'
    const handler = new RouteHandler()
    let handlerACalled = false
    let handlerBCalled = false
    const handlers = [
      async (ctx, next) => {
        console.log('called')
        handlerACalled = true
        await next()
      },
      async (ctx, next) => {
        console.log('called')
        handlerBCalled = true
      }
    ]

    await handler.setMethodHandler(method, handlers)
    await handler.handleRequest({
      request: { method }
    })

    expect(handlerACalled).to.equal(true)
    expect(handlerBCalled).to.equal(true)
  })
})
