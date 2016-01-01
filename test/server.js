import {expect} from 'chai'
import {load} from 'cheerio'
import React from 'react'
import {Route, Redirect} from 'react-router'
import request from 'request'

import SmushServer from '../src/server.js'

// Conveience method for verifying the number of elements matching a selector.
// Adds the selector name to the assertion failure for clarity.
function expectSelector($, selector, length) {
  expect($(selector), selector).to.have.length(length)
}

describe('SmushServer', function () {
  const mountPoint = 'mount'
  const initialState = 'zzz'
  const scripts = ['/a.js', '/b.js']
  const styles = ['/a.css', '/b.css']
  const port = 8080
  const state = 42

  function getTitle() {
    return 'Sweet Title'
  }

  function get(path, cb) {
    request({
      url: `http://localhost:${port}${path}`,
      // So we can see any 30x status codes.
      followRedirect: false,
    }, (err, resp, body) => {
      // Only call load if body is defined.
      cb(err, resp, body && load(body))
    })
  }

  function Foo() {
    return <div className="foo"></div>
  }

  function Bar() {
    return <div className="bar"></div>
  }

  function Params(props) {
    return <div data-a={props.params.a} data-b={props.location.query.b}></div>
  }

  function onEnterWait(newState, replaceState, done) {
    setTimeout(done, 1000)
  }

  const routes = [
    <Route path="/foo" component={Foo} />,
    <Route path="/bar" component={Bar} />,
    <Redirect from="/phoo" to="/foo" />,
    <Route path="/async" component={Foo} onEnter={onEnterWait} />,
    <Route path="/params(/:a)" component={Params} />,
  ]

  // Something to return 200 when we are not validating routes.
  const validPath = '/foo'

  function reducer() {
    return state
  }

  // Trivial koa middleware.
  function* addXPooHeader(next) {
    this.set('X-Poo', 'true')
    yield* next
  }

  // Start a single server for all tests.
  const server = new SmushServer({
    port,
    routes,
    reducer,
    mountPoint,
    initialState,
    scripts,
    styles,
    getTitle,
    middleware: [addXPooHeader],
  })
  before(function (done) {
    // This will throw if something else is already listening.
    server.run(done)
  })

  describe('.run(done)', function () {
    it('listens on the provided port', function (done) {
      get('/', (err) => {
        expect(err).is.null
        done()
      })
    })

    describe('uses the provided routes', function () {
      it('/ returns 404', function (done) {
        get('/', (err, resp) => {
          expect(resp.statusCode).to.be.equal(404)
          done()
        })
      })

      it('/foo returns 200 with <Foo />', function (done) {
        get('/foo', (err, resp, $) => {
          expect(resp.statusCode).to.be.equal(200)
          expectSelector($, 'body .foo', 1)
          expectSelector($, 'body .bar', 0)
          done()
        })
      })

      it('/bar returns 200 with <Bar />', function (done) {
        get('/bar', (err, resp, $) => {
          expect(resp.statusCode).to.be.equal(200)
          expectSelector($, 'body .bar', 1)
          expectSelector($, 'body .foo', 0)
          done()
        })
      })

      it('/phoo returns 302 to /foo', function (done) {
        get('/phoo', (err, resp, $) => {
          expect(resp.statusCode).to.be.equal(302)
          expect(resp.headers['location']).to.be.equal('/foo')
          done()
        })
      })

      it('/async returns 200 with <Foo /> after delay', function (done) {
        get('/async', (err, resp, $) => {
          expect(resp.statusCode).to.be.equal(200)
          expectSelector($, 'body .foo', 1)
          expectSelector($, 'body .bar', 0)
          done()
        })
      })
    })

    it('renders the app inside the mount point', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        // App should be only child of mount point.
        expectSelector($, `body > #${mountPoint} > *`, 1)
        // App should have a react doodad.
        expectSelector($, `body > #${mountPoint} > *[data-reactid]`, 1)
        done()
      })
    })

    it('serializes the initial state into an inline script tag', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        // Initial state should be only inline script.
        expectSelector($, 'body > script', 1)
        // Verify global variable name.
        expect($('body > script').text()).to.have.string(`window.${initialState} =`)
        done()
      })
    })

    it('uses the provided reducer', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        // Initial state is created by the reducer, so we verify against that
        expect($('body > script').text()).to.have.string(`= ${state}`)
        done()
      })
    })

    it('creates a body with just the app and initial state', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        expectSelector($, 'body > *', 2)
        done()
      })
    })

    it('inserts the provided scripts into head with defer', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        scripts.forEach(path => {
          expectSelector($, `head > script[src="${path}"][defer]`, 1)
        })
        done()
      })
    })

    it('inserts the provided styles into head', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        styles.forEach(path => {
          expectSelector($, `head > link[href="${path}"]`, 1)
        })
        done()
      })
    })

    it('calls the title provider to render the document title', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        expect($('title').text()).to.be.equal(getTitle())
        done()
      })
    })

    it('registers the provided koa middleware', function (done) {
      get(validPath, (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        // Request lowercases headers?
        expect(resp.headers['x-poo']).to.be.equal('true')
        done()
      })
    })

    it('supports params and query string in routes', function (done) {
      get("/params/1?b=2", (err, resp, $) => {
        expect(resp.statusCode).to.be.equal(200)

        expect($('div').attr('data-a')).to.be.equal('1')
        expect($('div').attr('data-b')).to.be.equal('2')
        done()
      })
    })
  })

  describe('.stop(done)', function () {
    it('closes the port', function (done) {
      server.stop(() => {
        // If server is stopped, nothing should be listening.
        get('/', (err) => {
          expect(err).is.not.null
          done()
        })
      })
    })
  })
})
