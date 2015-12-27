hut
===
[![Build Status](https://travis-ci.org/okorz001/hut.svg?branch=master)](https://travis-ci.org/okorz001/hut)

A minimal framework for isomorphic apps with react and redux.

Usage
-----

This package contains both server and client code. Both sides expose a simple
object-oriented interface.

```js
import HutServer from 'hut/lib/server'

// Create the app.
const opts = {}
const app = new HutServer(opts)
// Start serving requests asynchronously.
app.run(() => console.log('running'))

// You can also stop the server asynchronously.
app.stop(() => console.log('stopped'))
```

```js
import HutClient from 'hut/lib/client'

// Create the app.
const opts = {}
const app = new HutClient(opts)
// Start rendering components synchronously.
app.run()
```

Options
-------

Some options are shared between both sides, while others are specific to each
environment. For shared options, it is recommended to use a single definition
and use `Object.assign` to derive server and client options.

```js
const commonOpts = {foo: 'x'}
const serverOpts = Object.assign({}, commonOpts, {bar: 'y'})
const clientOpts = Object.assign({}, commonOpts, {baz: 'z'})
```

### Common

#### `mountPoint: string`
default: `'app'`

The id of the HTML element where the application will be rendered and mounted.

#### `stateVariable: string`
default: `'initialState'`

The name of the global variable where the redux store state will be serialized.
The state that is used to render the page on the server is serialized and sent
to the client. The client uses this initial state to seed the store in the
browser.

#### `routes: react-router Routes`
default: `[]`

This route or array of routes is passed directly to the react-router library
as-is. The default value is not very useful as it will not match any paths.

[See react-router documentation for more details about configuring routes.](https://github.com/rackt/react-router/blob/latest/docs/guides/basics/RouteConfiguration.md)

#### `reducer: redux reducer function`
default: `state => return state || {}`

This reducer is passed directly to the redux library as-is. The default value
is not very useful as it ignores every action, creating a stateless app.

[See redux documentation for more details about reducers.](http://rackt.org/redux/docs/basics/Reducers.html)

### Server

#### `port: integer`
default: `process.env.PORT || 3000`

The port to listen on.

#### `middleware: array of koa middleware`
default: `[]`

An array of middleware that is applied directly to the koa server as-is,
and in the specified order.

[See koa documentation for more details about middleware.](https://github.com/koajs/koa/blob/master/docs/guide.md#writing-middleware)

#### `getTitle: function`
default: `() => ''`

A function that is called to generate the page title during rendering.
The default value is not very useful as it creates an empty title.

#### `scripts: array of strings`
default: `[]`

An array of URLs that are inserted as script tags into the page header.
The scripts are inserted with a defer tag so they will not block
rendering.

*If the script is a relative URL, you must also register middleware to
actually serve it.*

#### `styles: array of strings`
default: `[]`

An array of URLs that are inserted as link tags into the page header.

*If the style is a relative URL, you must also register middleware to
actually serve it.*

### Client

#### `createHistory: function`
default: `history.createBrowserHistory`

A function that is called to control navigation and save history for
the app. The return value is passed directly to react-router as-is.
The default value creates a history that uses the HTML5 history API.

[See history documentation for more details about histories.](https://github.com/rackt/history)
