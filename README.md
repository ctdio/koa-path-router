# koa-path-router

[![Build Status](https://travis-ci.org/charlieduong94/koa-path-router.svg?branch=master)](https://travis-ci.org/charlieduong94/koa-path-router)
[![Coverage Status](https://coveralls.io/repos/github/charlieduong94/koa-path-router/badge.svg?branch=master)](https://coveralls.io/github/charlieduong94/koa-path-router?branch=master)

Fast and simple routing for [koa](https://github.com/koajs/koa).

## Installation

```bash
npm i --save koa-path-router
```

## Usage

### Creating an instance of the router

```js
const Router = require('koa-path-router')

const router = new Router()
```

Middleware for all routes handled by the router can be passed into the constructor

```js
const router = new Router({
  // define middleware for all routes (optional)
  middleware: [
    async (ctx, next) => {
      const startTime = Date.now()
      await next()
      console.log(`Request took ${Date.now() - startTime} ms`)
    }
  ]
})
```

### Adding more middleware

Additional middleware can be added to _subsequent_ routes via `use`:
```js
router.use(async (ctx, next) => {
  console.log('another layer of middleware')
  return next()
})
```

Multiple functions can be passed in if needed:

```js
router.use(...middlewareFuncs)

// or
router.use(functionA, functionB)
```


### Registering routes

Routes can be added by using the `register` function:

```js
// add routes via the register function
router.register({
  path: '/some/path',
  method: 'POST',
  // route specific middleware (optional)
  middleware: [
    async (ctx, next) => {
      const startTime = Date.now()
      await next()
      console.log(Date.now() - startTime)
    }
  ]
  handler: async (ctx) => {
    ctx.body = 'Hello world'
  }
})
```

Querystring parameters and the hash are parsed out and placed onto the context.

```js
router.register({
  path: '/some/route',
  method: 'GET',
  handler: async (ctx) => {
    // ex request '/some/route?key=value&otherKey=otherValue#this-is-a-hash'
    const { query, hash } = ctx
    const { key, otherKey } = query

    // key === 'value', otherKey === 'otherValue'
    // hash === 'this-is-a-hash'

    ctx.body = `Hello world`
  }
})
```

Placeholders are added by specifying a segment with a colon (`:`):

```js
router.register({
  path: '/some/:placeholder',
  method: 'GET',
  handler: async (ctx) => {
    const [ placeholder ] = ctx.params
    ctx.body = `Hello ${placeholder}`
  }
})

```

Wildcard routes can be added by appending a `*` to the end of a route:

```js
router.register({
  path: '/something/*',
  method: 'GET',
  handler: async (ctx) => {
    const [ placeholder ] = ctx.params
    ctx.body = `Hello ${placeholder}`
  }
})
```

Express style functions are exposed for convenience:

```js
router.get('/another/path', async (ctx) => {
  ctx.body = 'Hello world'
})

router.post('/some/other/path', async (ctx) => {
  ctx.body = 'Hello world again'
})
```

Multiple middleware functions can be passed in before the final handler as well:

```js
router.post('/a/path',
  // middleware A
  async (ctx, next) => {
    next()
  },

  // middleware B
  async (ctx, next) => {
    next()
  },

  // more middleware can be added here..
  // (middleware C, middleware D, etc.)

  // last function is the final request handler
  async (ctx) => {
    ctx.body = 'hi'
  })

// alternatively if you have a your middleware defined in an array, you can do
router.post('path', ...middleware, finalHandler)
```

To use the router with a `koa` app instance, pass it the function returned by `getRequestHandler`:

```js
app.use(router.getRequestHandler())
```

### A minimal example
```js
const Koa = require('koa')
const app = new Koa()

const Router = require('koa-path-router')
const router = new Router({
  // define middleware for all routes (optional)
  middleware: [
    async (ctx, next) => {
      const startTime = Date.now()
      await next()
      console.log(`Request took ${Date.now() - startTime} ms`)
    }
  ]
})

// add routes via the register function
router.register({
  path: '/hello',
  method: 'GET',
  handler: async (ctx) => {
    ctx.body = 'Hello world'
  }
})

app.use(router.getRequestHandler())

app.listen(8080, () => {
  console.log('Server is listening on port 8080')
})
```
