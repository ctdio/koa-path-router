const RouteHandler = require('../src/RouteHandler')
const { expect } = require('chai')
const compose = require('koa-compose')

describe('RouteHandler', () => {
  it('should be able to assign handlers to a method', () => {
    const method = 'GET'
    const handler = new RouteHandler()
    const fn = async () => {}

    handler.setMethodHandler(method, fn)

    expect(handler._handlers[method]).to.equal(fn)
  })

  it('should be able to handle requests with composed handlers ' +
    'if the next function is called', async () => {
    const method = 'GET'
    const handler = new RouteHandler()
    let handlerACalled = false
    let handlerBCalled = false
    const handlers = [
      async (ctx, next) => {
        handlerACalled = true
        await next()
      },
      async (ctx, next) => {
        handlerBCalled = true
      }
    ]

    await handler.setMethodHandler(method, compose(handlers))
    await handler.handleRequest({
      request: { method }
    })

    expect(handlerACalled).to.equal(true)
    expect(handlerBCalled).to.equal(true)
  })
})
