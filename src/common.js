import React from 'react'
import {createStore} from 'redux'
import {Provider} from 'react-redux'

const defaultRoutes = []

function defaultReducer(state = []) {
  return state
}

export default class Hut {
  constructor(opts = {}) {
    // The global variable that will hold the serialized redux store.
    this.initialState = opts.initialState || 'initialState'

    // The class of the DOM node where react will be mounted/rendered.
    this.mountPoint = opts.mountPoint || 'app'

    // The react-router routes.
    this.routes = opts.routes || defaultRoutes

    // The redux reducer.
    this.reducer = opts.reducer || defaultReducer
  }

  createStore(initialState) {
    return this.store = createStore(this.reducer, initialState)
  }

  createElement(Component, props) {
    const element = React.createElement(Component, props)
    return React.createElement(Provider, {store: this.store}, element)
  }
}
