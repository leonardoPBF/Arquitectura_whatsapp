const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const axios = require('axios');
process.env.JWT_SECRET = 'security-test-only-secret-'.repeat(3);
process.env.RASA_ACTIONS_TOKEN = 'rasa-test-only-'.repeat(4);
process.env.WA_SERVICE_TOKEN = 'whatsapp-test-only-'.repeat(4);
const app = require('../dist/app').default;
const { User } = require('../dist/models/User');
const { Order } = require('../dist/models/Order');
const { Customer } = require('../dist/models/Customer');
const { Payment } = require('../dist/models/Payment');
const admin = '111111111111111111111111', customer = '222222222222222222222222';
const customerId = '333333333333333333333333', orderId = '444444444444444444444444';
const token = (id, claims = {}) => jwt.sign({ userId: id, ...claims }, process.env.JWT_SECRET, { expiresIn: '5m', jwtid: Math.random().toString() });
let server, url;
before(async () => { server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); }); url = `http://127.0.0.1:${server.address().port}/api`; });
after(() => new Promise(resolve => server.close(resolve)));
beforeEach(() => {
  mock.restoreAll();
  mock.method(User, 'findById', async id => ({ _id: id, role: id === admin ? 'admin' : 'customer', isActive: true, customerId }));
});
async function request(path, { method = 'GET', body, bearer, service } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (service) headers['x-service-token'] = service;
  return fetch(url + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
const query = value => { const result = Promise.resolve(value); result.populate = () => result; return result; };

test('only an administrator can reset an active customer login password', async () => {
  const path = `/auth/customers/${customerId}/reset-password`;
  const body = { password: 'new-password-fixture-123' };
  assert.equal((await request(path, { method: 'POST', body })).status, 401);
  assert.equal((await request(path, { method: 'POST', body, bearer: token(customer) })).status, 403);
  assert.equal((await request(path, { method: 'POST', body: { password: 'short' }, bearer: token(admin) })).status, 400);
  let saved = false;
  const account = { tokenVersion: 2, save: async () => { saved = true; } };
  mock.method(User, 'findOne', async filter => {
    assert.deepEqual(filter, { customerId, role: 'customer', isActive: true });
    return account;
  });
  assert.equal((await request(path, { method: 'POST', body, bearer: token(admin) })).status, 200);
  assert.equal(saved, true);
  assert.equal(account.password, body.password);
  assert.equal(account.tokenVersion, 3);
});

test('reset passwords revoke older tokens and missing login accounts return 404', async () => {
  mock.method(User, 'findOne', async () => null);
  assert.equal((await request(`/auth/customers/${customerId}/reset-password`, {
    method: 'POST', body: { password: 'new-password-fixture-123' }, bearer: token(admin),
  })).status, 404);
  mock.method(User, 'findById', async () => ({ isActive: true, tokenVersion: 1, role: 'customer', customerId }));
  assert.equal((await request('/orders', { bearer: token(customer) })).status, 401);
  mock.method(Order, 'find', () => query([]));
  assert.equal((await request('/orders', { bearer: token(customer, { tokenVersion: 1 }) })).status, 200);
});

test('private data, administrative creation and WhatsApp registration require credentials', async () => {
  for (const path of ['/orders', '/customers', '/payments', '/conversations', '/sheets/export', '/culqi/payment/' + orderId]) assert.equal((await request(path)).status, 401);
  for (const path of ['/chatbot', '/auth/create-admin', '/auth/register-from-whatsapp']) assert.equal((await request(path, { method: 'POST', body: {} })).status, 401);
});
test('public registration cannot request an administrative role', async () => {
  assert.equal((await request('/auth/register', { method: 'POST', body: { role: 'admin' } })).status, 403);
});
test('public registration cannot claim an existing customer by phone', async () => {
  mock.method(User, 'findOne', async () => null);
  mock.method(Customer, 'findOne', async () => ({ _id: customerId }));
  assert.equal((await request('/auth/register', { method: 'POST', body: { email: 'fixture@example.test', password: 'fixture-password-long', name: 'Fixture', phone: '51999999999' } })).status, 409);
});
test('role in JWT does not override current database role', async () => {
  assert.equal((await request('/chatbot', { method: 'POST', bearer: token(customer, { role: 'admin' }), body: { message: 'hola' } })).status, 403);
  assert.equal((await request('/auth/create-admin', { method: 'POST', bearer: token(customer), body: {} })).status, 403);
});
test('expired, forged, inactive and unverifiable sessions fail closed', async () => {
  assert.equal((await request('/orders', { bearer: 'invalid' })).status, 401);
  const expired = jwt.sign({ userId: admin }, process.env.JWT_SECRET, { expiresIn: -1 });
  assert.equal((await request('/orders', { bearer: expired })).status, 401);
  mock.method(User, 'findById', async () => ({ isActive: false }));
  assert.equal((await request('/orders', { bearer: token(admin) })).status, 401);
  mock.method(User, 'findById', async () => { throw new Error('database credentials must not leak'); });
  const r = await request('/orders', { bearer: token(admin) });
  assert.equal(r.status, 503); assert.ok(!(await r.text()).includes('credentials'));
});
test('customer order listing is scoped on the server', async () => {
  let filter;
  mock.method(Order, 'find', value => { filter = value; return query([]); });
  assert.equal((await request('/orders', { bearer: token(customer) })).status, 200);
  assert.deepEqual(filter, { customerId });
});
test('customers cannot read or cancel an order owned by someone else', async () => {
  mock.method(Order, 'exists', async filter => { assert.equal(filter.customerId, customerId); return null; });
  for (const [path, method] of [[`/orders/${orderId}`, 'GET'], [`/orders/${orderId}/cancel`, 'POST']]) {
    assert.equal((await request(path, { method, bearer: token(customer), body: method === 'POST' ? {} : undefined })).status, 404);
  }
});
test('customers cannot choose a different owner when creating an order', async () => {
  assert.equal((await request('/orders', { method: 'POST', bearer: token(customer), body: { customerId: admin } })).status, 403);
});
test('payments are scoped and query operator injection is rejected', async () => {
  let filter; mock.method(Payment, 'find', value => { filter = value; return query([]); });
  assert.equal((await request('/payments?orderId=' + orderId, { bearer: token(customer) })).status, 200);
  assert.equal(filter.customerId, customerId);
  assert.equal((await request('/payments?status=paid&status=pending', { bearer: token(customer) })).status, 400);
});
test('gateway payment details also enforce ownership', async () => {
  mock.method(Payment, 'exists', async () => null);
  assert.equal((await request('/culqi/order/ord_fixture', { bearer: token(customer) })).status, 404);
});
test('Rasa credential may read but cannot write, register or invoke administrative chat', async () => {
  mock.method(Order, 'find', () => query([]));
  const service = process.env.RASA_ACTIONS_TOKEN;
  assert.equal((await request('/orders', { service })).status, 200);
  for (const [path, method] of [['/orders', 'POST'], [`/orders/${orderId}`, 'DELETE'], [`/orders/${orderId}/cancel`, 'POST'], ['/auth/create-admin', 'POST'], ['/chatbot', 'POST']]) {
    assert.equal((await request(path, { method, service, body: {} })).status, 403);
  }
});
test('WhatsApp credential cannot alter order state or elevate role', async () => {
  for (const path of ['/auth/create-admin', '/chatbot', `/orders/${orderId}/cancel`]) assert.equal((await request(path, { method: 'POST', service: process.env.WA_SERVICE_TOKEN, body: {} })).status, 403);
});
test('chat sender is derived from user and session, never browser metadata', async () => {
  const calls = []; mock.method(axios, 'post', async (_url, body) => { calls.push(body); return { data: [{ text: 'hola', recipient_id: body.sender }] }; });
  const bearer = token(admin);
  const body = { message: 'hola', sender: 'another-user', metadata: { role: 'admin' }, conversationId: 'test' };
  const a = await request('/chatbot', { method: 'POST', bearer, body });
  assert.deepEqual(await a.json(), [{ text: 'hola' }]);
  await request('/chatbot', { method: 'POST', bearer: token(admin), body });
  assert.notEqual(calls[0].sender, calls[1].sender);
  assert.ok(calls[0].sender.startsWith(`admin:${admin}:`));
  assert.equal(calls[0].metadata, undefined);
});
test('chat rejects invalid inputs and hides provider failures', async () => {
  const bearer = token(admin);
  for (const message of [{ text: 'hola' }, '', 'x'.repeat(2001)]) assert.equal((await request('/chatbot', { method: 'POST', bearer, body: { message } })).status, 400);
  mock.method(axios, 'post', async () => { throw new Error('private-token'); });
  const r = await request('/chatbot', { method: 'POST', bearer, body: { message: 'hola' } });
  assert.equal(r.status, 503); assert.ok(!(await r.text()).includes('private-token'));
});
test('physical deletion is disabled even for admins', async () => {
  assert.equal((await request(`/orders/${orderId}`, { method: 'DELETE', bearer: token(admin) })).status, 405);
});
test('mass assignment and invalid transitions are rejected', async () => {
  const bearer = token(admin);
  assert.equal((await request(`/orders/${orderId}`, { method: 'PUT', bearer, body: { paymentStatus: 'paid', totalAmount: 0 } })).status, 400);
  mock.method(Order, 'findById', async () => ({ _id: orderId, status: 'delivered', paymentStatus: 'paid' }));
  assert.equal((await request(`/orders/${orderId}/cancel`, { method: 'POST', bearer, body: {} })).status, 409);
});
test('unpaid cancellation preserves the order and uses compare-and-set', async () => {
  mock.method(Order, 'findById', async () => ({ _id: orderId, status: 'pending', paymentStatus: 'pending' }));
  let update;
  mock.method(Order, 'findOneAndUpdate', async (filter, change) => { assert.deepEqual(filter, { _id: orderId, status: 'pending', paymentStatus: 'pending', paymentLock: { $ne: true } }); update = change; return { _id: orderId, status: 'cancelled' }; });
  assert.equal((await request(`/orders/${orderId}/cancel`, { method: 'POST', bearer: token(admin), body: {} })).status, 200);
  assert.equal(update.$set.status, 'cancelled');
});
test('unverified payment notifications cannot change state', async () => {
  assert.equal((await request('/culqi/webhook', { method: 'POST', body: { type: 'charge.succeeded', data: {} } })).status, 503);
  assert.equal((await request('/culqi/Webhook', { method: 'POST', bearer: token(admin), body: { type: 'charge.succeeded', data: {} } })).status, 503);
});
test('chat request budget is enforced per authenticated user', async () => {
  mock.method(axios, 'post', async () => ({ data: [] }));
  let status;
  for (let i = 0; i < 31; i++) status = (await request('/chatbot', { method: 'POST', bearer: token(admin), body: { message: 'hola' } })).status;
  assert.equal(status, 429);
});

test('the trusted WhatsApp service retains the checkout flow without administrative writes', async () => {
  const { securityGate } = require('../dist/middlewares/security');
  for (const [path, method, body] of [
    ['/conversations', 'POST', { phone: '51999999999' }],
    ['/conversations/51999999999/step', 'PATCH', { currentStep: 'menu' }],
    [`/customers/${customerId}`, 'PUT', { name: 'Fixture', email: 'fixture@example.test' }],
    ['/orders', 'POST', { customerId }], ['/culqi/create-order', 'POST', { orderId }],
    ['/auth/register-from-whatsapp', 'POST', {}],
  ]) {
    let allowed = false;
    await securityGate({ path, method, body, get: name => name === 'x-service-token' ? process.env.WA_SERVICE_TOKEN : undefined },
      { locals: {}, sendStatus: code => assert.fail(`${path}: ${code}`) }, () => { allowed = true; });
    assert.ok(allowed, path);
  }
});
test('a customer may edit delivery details only while their unpaid order is pending', async () => {
  mock.method(Order, 'exists', async filter => { assert.equal(filter.status, 'pending'); return { _id: orderId }; });
  mock.method(Order, 'findOneAndUpdate', async filter => { assert.equal(filter.customerId, customerId); assert.equal(filter.paymentStatus, 'pending'); return { _id: orderId }; });
  assert.equal((await request(`/orders/${orderId}`, { method: 'PUT', bearer: token(customer), body: { deliveryAddress: 'Fixture' } })).status, 200);
  assert.equal((await request(`/orders/${orderId}`, { method: 'PUT', bearer: token(customer), body: { status: 'confirmed' } })).status, 403);
});
test('payment amounts cannot be supplied by the caller', async () => {
  mock.method(Payment, 'findOne', () => query({ orderId, amount: 100 }));
  mock.method(Order, 'findById', async () => ({ _id: orderId }));
  const response = await request('/culqi/create-charge', { method: 'POST', bearer: token(admin), body: { tokenId: 'tkn_test_fixture', culqiOrderId: 'ord_test_fixture', amount: 1 } });
  assert.equal(response.status, 400);
  assert.match((await response.json()).message, /importe/);
});
