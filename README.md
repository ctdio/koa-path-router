# koa-path-router

Fast and simple routing for [koa](https://github.com/koajs/koa).

### Installation

```
npm i --save koa-path-router
```

### Usage

```
const Koa = require('koa')
const Router = require('koa-path-router')

const app = new Koa()
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
  path: '/some/path',
  method: 'POST',
  // route specific middleware (optional)
  middleware: [
    async (ctx, next) => {
      const startTime = Date.now()
      await next()
      date.
    }
  ]
  handler: async (ctx) => {
    ctx.body = 'Hello world'
  }
})

// additional middleware can be added to subsequent routes via "use",
// multiple functions can be passed in if needed router.use(...middlewareFuncs)
router.use(async (ctx, next) => {
  console.log('another layer of middleware')
  return next()
})


// add routes via express style convenience functions
router.get('/another/path', async (ctx) => {
  ctx.body = 'Hello world again'
})

app.use(router.getRequestHandler())

app.listen(8080, () => {
  console.log('Server is listening on port 8080')
})
```

###Todo
  - Add more docs
