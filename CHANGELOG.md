## [0.1.1](https://github.com/okorz001/hut/compare/v0.1.0...v0.1.1)

* Remove undocumented empty body check. Koa middleware that renders a body
  should not yield next.
* Support async onEnter Route hooks. Rendering will block until all onEnter
  hooks are completed.
