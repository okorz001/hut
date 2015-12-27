import createBrowserHistory from 'history/lib/createBrowserHistory'
import React from 'react'
import {render} from 'react-dom'
import {Router} from 'react-router'

import Hut from './common.js'

export default class HutClient extends Hut {
  constructor(opts = {}) {
    super(opts)

    // The history factory.
    this.createHistory = opts.createHistory || createBrowserHistory
  }

  run() {
    const initialState = window[this.initialState]
    const store = this.createStore(initialState)

    const history = this.createHistory()
    const app = this.createElement(Router, {history, routes: this.routes})

    render(app, document.getElementById(this.mountPoint))
  }
}
