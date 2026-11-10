import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterOrders } from '../src/lib/order-history.ts';
import type { HistoryOrder } from '../src/lib/order-history.ts';
const now = Date.parse('2026-11-20T12:00:00Z');
const orders: HistoryOrder[] = [
  { _id: 'a', orderNumber: 'ORD-000001', customerId: 'customer', createdAt: '2026-10-01', totalAmount: 50, status: 'cancelled', paymentStatus: 'pending' },
  { _id: 'b', orderNumber: 'ORD-000002', customerId: 'customer', createdAt: '2026-11-19', totalAmount: 200, status: 'confirmed', paymentStatus: 'paid', items: [{ productName: 'Cámara inalámbrica', price: 100, quantity: 2 }] },
  { _id: 'c', orderNumber: 'ORD-000003', customerId: 'customer', createdAt: '2026-11-15', totalAmount: 10, status: 'pending', paymentStatus: 'failed' },
];
const defaults = { search: '', status: 'all', payment: 'all', period: 'all', sort: 'newest' };
test('combines search, order/payment statuses and period without altering input', () => {
  assert.deepEqual(filterOrders(orders, { ...defaults, search: 'CAMARA', status: 'confirmed', payment: 'paid', period: '7' }, now).map(o => o._id), ['b']);
  assert.deepEqual(filterOrders(orders, { ...defaults, search: '000003', payment: 'paid' }, now), []);
  assert.deepEqual(orders.map(o => o._id), ['a', 'b', 'c']);
});
test('orders by date or amount and excludes old entries with a date filter', () => {
  assert.deepEqual(filterOrders(orders, defaults, now).map(o => o._id), ['b', 'c', 'a']);
  assert.deepEqual(filterOrders(orders, { ...defaults, sort: 'oldest' }, now).map(o => o._id), ['a', 'c', 'b']);
  assert.deepEqual(filterOrders(orders, { ...defaults, sort: 'amount-low' }, now).map(o => o._id), ['c', 'a', 'b']);
  assert.equal(filterOrders(orders, { ...defaults, period: '30' }, now).length, 2);
});
