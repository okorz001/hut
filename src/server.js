import koa from 'koa'
import {createServer} from 'http'
import React from 'react'
import {renderToString} from 'react-dom/server'
// TODO: react-router 1.1 renames to RouterContext
import {RoutingContext, match} from 'react-router'

import Hut from './common.js'

export default class HutServer extends Hut {
  constructor(opts = {}) {
    super(opts)

    // The port to bind on.
    this.port = opts.port || 3000

    // An ordered list of middleware to apply to koa.
    this.middleware = opts.middleware || []

    // The title used during server rendering. May also be a function.
    this.getTitle = opts.getTitle || (() => '')

    // Scripts to include unconditionally on every render.
    this.scripts = (opts.scripts || []).map(script => {
      return `<script type="text/javascript" src="${script}" defer></script>`
    }).join('')

    // Stylesheets to include unconditionally on every render.
    this.styles = (opts.styles || []).map(style => {
      return `<link rel="stylesheet" type="text/css" href="${style}">`
    }).join('')
  }

  run(cb) {
    const app = koa()

    this.middleware.forEach(mw => app.use(mw))

    // TODO: koa 2.0 passes context instead of binding to this.
    const self = this
    app.use(function* () {
      yield new Promise((resolve, reject) => self.renderSite(this, resolve))
    })

    this.server = createServer(app.callback())
    this.server.listen(this.port, cb)
  }

  stop(cb) {
    this.server.close(cb)
    this.server = null
  }

  renderSite(ctx, done) {
    match({routes: this.routes, location: ctx.url}, (err, redir, props) => {
      if (err) {
        ctx.status = 500
        ctx.body = `Error: ${err}`
        return done()
      }

      if (redir) {
        ctx.redirect(redir.pathname)
        ctx.status = 302
        ctx.body = `Moved: ${ctx.path} => ${redir.pathname}`
        return done()
      }

      if (!props) {
        ctx.status = 404
        ctx.body = `Bad route: ${ctx.path}`
        return done()
      }

      const store = this.createStore()

      // Populate the store before rendering.
      const promises = []
      props.routes.forEach(route => {
        (route.component.actions || []).forEach(action => {
          promises.push(store.dispatch(action(props)))
        })
      })

      Promise.all(promises).then(() => {
        const app = this.createElement(RoutingContext, props)
        const html = renderToString(app)
        const title = this.getTitle()
        const initialState = JSON.stringify(store.getState())

        ctx.set('Content-Type', 'text/html; charset=utf-8')
        ctx.body = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta char-set="utf-8">
          <meta name="viewport" content="width=device-width, user-scalable=no">
          ${this.scripts}
          ${this.styles}
          <title>${title}</title>
        </head>
        <body>
          <section id="${this.mountPoint}">${html}</section>
          <script type="text/javascript">
            window.${this.initialState} = ${initialState}
          </script>
        </body>
        </html>
        `
        return done()
      }, (err) => {
        ctx.status = 500
        ctx.body = `Error: ${err}`
        return done()
      })
    })
  }
}
