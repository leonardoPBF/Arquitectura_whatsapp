const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveSenderPhone } = require('../dist/sender.js');
const { handleMessage } = require('../dist/handlers/index.js');
const { api } = require('../dist/services/whatsapp.service.js');
const { getSession, clearSession } = require('../dist/utils/context.js');

test('a direct sender uses the phone without an extra lookup', async () => {
  const phone = await resolveSenderPhone({}, '51999999999@c.us');
  assert.equal(phone, '51999999999');
});

test('a LID resolves to the phone instead of becoming a second session key', async () => {
  const phone = await resolveSenderPhone({
    getContactLidAndPhone: async () => [{ lid: '123@lid', pn: '51999999999@c.us' }],
  }, '123@lid');
  assert.equal(phone, '51999999999');
});

test('an unresolved LID does not get stored as a telephone number', async () => {
  const phone = await resolveSenderPhone({
    getContactLidAndPhone: async () => [{ lid: '123@lid' }],
  }, '123@lid');
  assert.equal(phone, undefined);
});

test('first message restores a saved cart using the resolved phone', async (t) => {
  const phone = '51999999999';
  t.after(() => clearSession(phone));
  const lookup = t.mock.method(api, 'getConversationByPhone', async (key) => {
    assert.equal(key, phone);
    return { cart: [{ productId: 'product-1', price: 12, quantity: 2 }], currentStep: 'cart' };
  });
  await handleMessage({}, { from: '123@lid', body: 'menu', reply: async () => {} }, {
    phone, name: 'Cliente de prueba',
  });
  assert.equal(lookup.mock.callCount(), 1);
  assert.equal(getSession(phone).cart[0].quantity, 2);
  assert.equal(getSession(phone).contactName, 'Cliente de prueba');
  assert.equal(getSession('123@lid'), undefined);
});
