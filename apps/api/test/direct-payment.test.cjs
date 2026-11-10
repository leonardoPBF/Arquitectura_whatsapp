const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { AxiosError } = require('axios');
const enabled = !!process.env.PAYMENT_TEST_MONGO_URI;
const integration = (name, fn) => test(name, { skip: !enabled }, fn);
process.env.JWT_SECRET = 'direct-payment-test-secret-'.repeat(3);
process.env.LOCAL_LINK = 'http://localhost:5173/checkout';
const app = require('../dist/app').default;
const { Order } = require('../dist/models/Order');
const { Payment, migratePaymentIndex } = require('../dist/models/Payment');
const { User } = require('../dist/models/User');
const { Customer } = require('../dist/models/Customer');
const { Product } = require('../dist/models/Product');
const { chargeGateway, reconcileCardPayment } = require('../dist/service/direct-payment');
let server, base, customer, token, product;
const dbName = 'culqi_payment_test_' + randomUUID().replaceAll('-', '');
before(async () => {
  if (!enabled) return;
  await mongoose.connect(process.env.PAYMENT_TEST_MONGO_URI, { dbName });
  await Payment.collection.createIndex({ culqiOrderId: 1 }, { unique: true });
  await migratePaymentIndex();
  assert.ok((await Payment.collection.indexes()).find(index => index.name === 'culqiOrderId_1').partialFilterExpression);
  await Order.init();
  customer = await Customer.create({ name: 'Pago Prueba', email: 'payment@example.test', phone: '900000001' });
  const user = await User.create({ name: customer.name, email: customer.email, phone: customer.phone,
    password: 'only-for-isolated-payment-tests', role: 'customer', customerId: customer._id });
  token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '1h' });
  product = await Product.create({ name: 'Prueba', description: 'Test', price: 10, stock: 10, category: 'test' });
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (!enabled) return;
  if (server) await new Promise(resolve => server.close(resolve));
  // Only the random database created by this test may be removed.
  assert.equal(mongoose.connection.name, dbName);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});
beforeEach(() => {
  mock.restoreAll();
  mock.method(chargeGateway, 'create', async () => { throw Error('Provider must be explicitly mocked'); });
  mock.method(chargeGateway, 'list', async () => []);
  mock.method(chargeGateway, 'get', async () => { throw Error('Provider lookup must be explicitly mocked'); });
});
async function request(path, body) {
  const response = await fetch(base + path, { method: 'POST', headers: {
    'Content-Type': 'application/json', Authorization: 'Bearer ' + token,
  }, body: JSON.stringify(body) });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = { message: text }; }
  return { status: response.status, data };
}
async function order() {
  const response = await request('/orders', { customerId: String(customer._id), items: [{ productId: String(product._id), quantity: 1 }] });
  assert.equal(response.status, 201);
  return response.data;
}
async function prepared() {
  const result = await order();
  assert.equal((await request('/culqi/create-order', { orderId: result._id, method: 'card' })).status, 200);
  return result;
}
const success = payload => ({ id: 'chr_test_' + randomUUID(), amount: payload.amount,
  currency_code: 'PEN', metadata: payload.metadata, outcome: { type: 'venta_exitosa' } });
const charge = orderId => request('/culqi/create-charge', { orderId, tokenId: 'tkn_test_fixture', amount: 10 });

integration('real Culqi authentication_required error starts 3DS instead of endless review', async () => {
  const purchase = await prepared();
  const initial = { orderId: purchase._id, tokenId: 'tkn_test_fixture', deviceId: 'fixture-device' };
  mock.method(chargeGateway, 'create', async () => {
    throw new AxiosError('3DS required', 'ERR_BAD_REQUEST', undefined, undefined, { status: 400,
      data: { type: 'card_error', charge_id: 'chr_test_denied', code: 'DNGE0116', decline_code: 'authentication_required' } });
  });
  const result = await request('/culqi/create-charge', initial);
  assert.equal(result.data.requiresAction, true);
  assert.equal((await Payment.findOne({ orderId: purchase._id })).status, 'requires_action');
  mock.method(chargeGateway, 'create', async payload => success(payload));
  const completed = await request('/culqi/create-charge', { ...initial, attemptId: result.data.attemptId,
    authentication3DS: { eci: '05', xid: 'fixture', cavv: 'fixture', protocolVersion: '2.1.0' } });
  assert.equal(completed.data.success, true);
});

integration('initial 3DS denial cannot unlock an uncertain authenticated continuation', async () => {
  const purchase = await prepared();
  let evidence;
  mock.method(chargeGateway, 'create', async payload => { evidence = { ...success(payload), outcome: { type: 'operacion_denegada', decline_code: 'authentication_required' } }; throw Error('unknown result'); });
  await charge(purchase._id);
  mock.method(chargeGateway, 'list', async () => [evidence]);
  await reconcileCardPayment(await Payment.findOne({ orderId: purchase._id }));
  assert.equal((await Order.findById(purchase._id)).paymentLock, true);
  assert.equal((await Payment.findOne({ orderId: purchase._id })).status, 'review');
});

integration('3DS challenge is continued exactly once with the same source, device and attempt', async () => {
  const purchase = await prepared();
  const initial = { orderId: purchase._id, tokenId: 'tkn_test_fixture', deviceId: 'fixture-device' };
  mock.method(chargeGateway, 'create', async () => ({ action_code: 'REVIEW' }));
  const first = await request('/culqi/create-charge', initial);
  assert.equal(first.data.requiresAction, true);
  assert.equal((await Payment.findOne({ orderId: purchase._id })).status, 'requires_action');
  const waiting = await request('/culqi/verify-payment', { orderId: purchase._id });
  assert.equal(waiting.data.requiresAction, true);
  assert.equal(waiting.data.pending, false);
  assert.equal((await request('/culqi/create-charge', initial)).status, 409);
  const authentication3DS = { eci: '05', xid: 'fixture-xid', cavv: 'fixture-cavv', protocolVersion: '2.1.0', directoryServerTransactionId: 'fixture-directory' };
  const continuation = { ...initial, attemptId: first.data.attemptId, authentication3DS };
  assert.equal((await request('/culqi/create-charge', { ...continuation, tokenId: 'another-token' })).status, 409);
  assert.equal((await request('/culqi/create-charge', { ...continuation, deviceId: 'another-device' })).status, 409);
  assert.equal((await request('/culqi/create-charge', { ...continuation, attemptId: 'another-attempt' })).status, 409);
  mock.method(chargeGateway, 'create', async payload => {
    assert.equal(payload.source_id, initial.tokenId);
    assert.equal(payload.antifraud_details.device_finger_print_id, initial.deviceId);
    assert.deepEqual(payload.authentication_3DS, authentication3DS);
    assert.equal(payload.metadata.payment_attempt, first.data.attemptId);
    await new Promise(resolve => setTimeout(resolve, 50));
    return success(payload);
  });
  const results = await Promise.all([request('/culqi/create-charge', continuation), request('/culqi/create-charge', continuation)]);
  assert.ok(results.some(result => result.data.success));
  assert.equal(chargeGateway.create.mock.calls.length, 1);
  assert.equal((await Order.findById(purchase._id)).paymentStatus, 'paid');
  assert.equal((await Payment.findOne({ orderId: purchase._id })).status, 'completed');
});

integration('same checkout key under concurrent retries creates one internal order', async () => {
  const body = { checkoutKey: randomUUID(), customerId: String(customer._id), items: [{ productId: String(product._id), quantity: 1 }] };
  const responses = await Promise.all(Array.from({ length: 5 }, () => request('/orders', body)));
  assert.ok(responses.every(r => [200, 201].includes(r.status)));
  assert.equal(new Set(responses.map(r => r.data._id)).size, 1);
  assert.equal(await Order.countDocuments({ checkoutKey: `${customer._id}:${body.checkoutKey}` }), 1);
  assert.equal((await request('/orders', { ...body, items: [{ productId: String(product._id), quantity: 2 }] })).status, 409);
});

integration('only an unsubmitted 3DS challenge can be restarted; uncertain charges stay locked', async () => {
  const purchase = await prepared();
  mock.method(chargeGateway, 'create', async () => ({ action_code: 'REVIEW' }));
  await request('/culqi/create-charge', { orderId: purchase._id, tokenId: 'tkn_test_fixture', deviceId: 'fixture-device' });
  assert.equal((await request('/culqi/cancel-authentication', { orderId: purchase._id })).status, 200);
  assert.equal((await Order.findById(purchase._id)).paymentLock, false);
  mock.method(chargeGateway, 'create', async () => { throw Error('unknown provider result'); });
  await charge(purchase._id);
  assert.equal((await request('/culqi/cancel-authentication', { orderId: purchase._id })).status, 409);
  assert.equal((await Order.findById(purchase._id)).paymentLock, true);
});

integration('concurrent preparations reuse one payment, omit provider order and allow multiple card orders', async () => {
  const first = await order();
  const responses = await Promise.all(Array.from({ length: 5 }, () => request('/culqi/create-order', { orderId: first._id, method: 'card' })));
  assert.ok(responses.every(r => r.status === 200));
  assert.equal(new Set(responses.map(r => r.data.payment._id)).size, 1);
  assert.ok(responses.every(r => r.data.culqiOrder === null && r.data.checkoutUrl.endsWith(first._id)));
  assert.equal(await Payment.countDocuments({ orderId: first._id }), 1);
  const second = await prepared();
  assert.equal((await Payment.findOne({ orderId: second._id })).culqiOrderId, undefined);
});

integration('concurrent charges and a subsequent retry call provider only once', async () => {
  const purchase = await prepared();
  let calls = 0;
  mock.method(chargeGateway, 'create', async payload => { calls++; await new Promise(resolve => setTimeout(resolve, 75)); return success(payload); });
  const results = await Promise.all([charge(purchase._id), charge(purchase._id)]);
  assert.ok(results.some(r => r.status === 200));
  assert.ok(results.every(r => [200, 409].includes(r.status)));
  assert.equal(calls, 1);
  assert.equal((await charge(purchase._id)).data.alreadyPaid, true);
  assert.equal(calls, 1);
  assert.equal((await Order.findById(purchase._id)).paymentStatus, 'paid');
});

integration('timeout keeps lock; reconciliation recovers approved charge without sending another', async () => {
  const purchase = await prepared();
  let accepted;
  let calls = 0;
  mock.method(chargeGateway, 'create', async payload => { calls++; accepted = success(payload); throw Error('connection lost after acceptance'); });
  assert.equal((await charge(purchase._id)).status, 202);
  assert.equal((await charge(purchase._id)).status, 409);
  mock.method(chargeGateway, 'list', async () => [accepted]);
  await reconcileCardPayment(await Payment.findOne({ orderId: purchase._id }));
  const verified = await request('/culqi/verify-payment', { orderId: purchase._id });
  assert.equal(verified.data.alreadyPaid, true);
  assert.equal((await Order.findById(purchase._id)).paymentStatus, 'paid');
  assert.equal(calls, 1);
});

integration('missing or mismatched provider evidence never unlocks an uncertain payment', async () => {
  const purchase = await prepared();
  let evidence;
  mock.method(chargeGateway, 'create', async payload => { evidence = success(payload); throw Error('timeout'); });
  await charge(purchase._id);
  const payment = await Payment.findOne({ orderId: purchase._id });
  await reconcileCardPayment(payment);
  mock.method(chargeGateway, 'list', async () => [{ ...evidence, amount: 1 }]);
  await reconcileCardPayment(payment);
  assert.equal((await Payment.findById(payment._id)).status, 'review');
  assert.equal((await charge(purchase._id)).status, 409);
  assert.equal((await request(`/orders/${purchase._id}/cancel`, {})).status, 409);
});

integration('definitive decline permits another token without creating another payment', async () => {
  const purchase = await prepared();
  mock.method(chargeGateway, 'create', async () => {
    throw new AxiosError('declined', 'ERR_BAD_REQUEST', undefined, undefined, { status: 400,
      data: { type: 'card_error', decline_code: 'insufficient_funds' } });
  });
  assert.equal((await charge(purchase._id)).status, 400);
  assert.equal((await Order.findById(purchase._id)).paymentLock, false);
  mock.method(chargeGateway, 'create', async payload => success(payload));
  assert.equal((await charge(purchase._id)).data.success, true);
  assert.equal(await Payment.countDocuments({ orderId: purchase._id }), 1);
});

integration('foreign orders, manipulated amounts and cancelled orders never reach provider', async () => {
  const purchase = await prepared();
  const foreign = await Order.create({ customerId: new mongoose.Types.ObjectId(), customerPhone: '900000002', items: [], totalAmount: 10 });
  assert.equal((await charge(String(foreign._id))).status, 404);
  assert.equal((await request('/culqi/create-charge', { orderId: purchase._id, tokenId: 'tkn_test_fixture', amount: 1 })).status, 400);
  assert.equal((await request(`/orders/${purchase._id}/cancel`, {})).status, 200);
  assert.equal((await charge(purchase._id)).status, 409);
  assert.equal(chargeGateway.create.mock.calls.length, 0);
});

integration('legacy provider IDs remain unique and are preserved by index migration', async () => {
  const purchase = await prepared();
  await Payment.updateOne({ orderId: purchase._id }, { $set: { culqiOrderId: 'ord_test_legacy' } });
  await migratePaymentIndex();
  assert.equal((await Payment.findOne({ orderId: purchase._id })).culqiOrderId, 'ord_test_legacy');
  const other = await prepared();
  await assert.rejects(Payment.updateOne({ orderId: other._id }, { $set: { culqiOrderId: 'ord_test_legacy' } }), { code: 11000 });
});
