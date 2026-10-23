import assert from 'node:assert/strict'
import test from 'node:test'
import authRouter from '../src/routes/auth.routes.js'

function routeMethods(path) {
  return authRouter.stack
    .filter((layer) => layer.route?.path === path)
    .flatMap((layer) => Object.keys(layer.route.methods))
}

test('exposes registration and login under the auth router prefix', () => {
  assert.deepEqual(routeMethods('/register'), ['post'])
  assert.deepEqual(routeMethods('/login'), ['post'])
})

test('exposes the protected current-user route under the auth router', () => {
  assert.deepEqual(routeMethods('/me'), ['get'])
  const meLayer = authRouter.stack.find((layer) => layer.route?.path === '/me')
  assert.equal(meLayer.route.stack.length, 2)
})
