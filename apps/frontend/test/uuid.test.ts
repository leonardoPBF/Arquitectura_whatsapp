import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUuid } from '../src/lib/uuid.ts';
import { createCheckoutKey } from '../src/lib/checkout-attempt.ts';

test('conversation and checkout IDs work when randomUUID is unavailable (HTTP/IP)', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  const getRandomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { getRandomValues },
  });

  try {
    assert.equal(typeof globalThis.crypto.randomUUID, 'undefined');
    for (const generate of [createUuid, createCheckoutKey]) {
      const ids = Array.from({ length: 1000 }, () => generate());
      assert.equal(new Set(ids).size, ids.length);
      for (const id of ids) {
        assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      }
    }
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});
