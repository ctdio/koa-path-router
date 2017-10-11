const https = require('https')
const fs = require('fs')
const { expect } = require('chai')

const Router = require('../src/Router')

const Koa = require('koa')

const { METHODS } = require('http')
const querystring = require('querystring')

describe('koa integration', () => {
  let router
  let server
  let port

  const simplePath = '/api/v1/test'
  const simpleGetPath = '/api/v1/test1'
  const placeholderPath = '/api/v2/:placeholderA/id/:placeholderB'
  const queryAndHashPath = '/api/v3/queryandhash'

  const wildcardPathPrefix = '/api/v4/'
  const wildcardPath = `${wildcardPathPrefix}**`

  function request (method, path) {
    let requestOptions = {
      hostname: 'localhost',
      port,
      path,
      method,
      rejectUnauthorized: false
    }

    return new Promise((resolve, reject) => {
      const req = https.request(requestOptions, (res) => {
        let data = ''

        res.setEncoding('utf8')

        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          if (data.length === 0) {
            resolve(null)
          } else {
            let resolved

            try {
              resolved = JSON.parse(data)
            } catch (e) {
              resolved = data
            }
            resolve(resolved)
          }
        })
      })

      req.on('error', reject)
      req.end()
    })
  }

  before('setup routes', () => {
    router = new Router()

    for (const method of METHODS) {
      router[method.toLowerCase()](simplePath, (ctx) => {
        ctx.body = {
          method
        }
      })
    }

    router.get(simpleGetPath, (ctx) => {
      ctx.body = {}
    })

    router.register({
      path: placeholderPath,
      handler: async (ctx) => {
        ctx.body = ctx.request.params
      }
    })

    router.register({
      path: queryAndHashPath,
      handler: async (ctx) => {
        ctx.body = {
          query: ctx.request.query
        }
      }
    })

    router.register({
      path: wildcardPath,
      handler: async (ctx) => {
        ctx.body = 'wild'
      }
    })
  })

  before('set http server', (done) => {
    const app = new Koa()
    app.use(router.getRequestHandler())

    const options = {
      key: fs.readFileSync(require.resolve('./util/key.pem')),
      cert: fs.readFileSync(require.resolve('./util/cert.pem'))
    }

    server = https.createServer(options, app.callback()).listen(0, function () {
      port = this.address().port
      done()
    })
  })

  after(() => {
    server.close()
  })

  it('should be able to handle http requests', async () => {
    for (const method of METHODS) {
      // unable to handle connect requests
      if (method !== 'CONNECT') {
        const response = await request(method, simplePath)

        if (method !== 'HEAD') {
          expect(response).to.deep.equal({ method })
        } else {
          expect(response).to.equal(null)
        }
      }
    }
  })

  it('should be able to parse params', async () => {
    const placeholderValueA = 'test'
    const placeholderValueB = 'test-id'
    const response = await request('GET', `/api/v2/${placeholderValueA}/id/${placeholderValueB}`)
    expect(response).to.deep.equal({
      placeholderA: placeholderValueA,
      placeholderB: placeholderValueB
    })
  })

  it('should handle request to a valid path with unimplemented method type', async () => {
    const response = await request('POST', simpleGetPath)
    expect(response).to.equal('Not Found')
  })

  it('should handle request to a valid path with unimplemented method type', async () => {
    const query = 'key=value&key2=value2'
    const response = await request('GET', `${queryAndHashPath}?${query}`)
    expect(querystring.stringify(response.query)).to.equal(query)
  })

  it('should be able to route requests to the wildcard path', async () => {
    const responseA = await request('GET', `${wildcardPathPrefix}wildcard`)
    expect(responseA).to.equal('wild')

    const responseB = await request('GET', `${wildcardPathPrefix}random/path`)
    expect(responseB).to.equal('wild')
  })
})
