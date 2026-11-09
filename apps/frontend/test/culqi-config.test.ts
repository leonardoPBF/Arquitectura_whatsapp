import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { culqiRsaSettings, isCulqiCheckoutUrl } from '../src/lib/culqi-config.ts';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const id = '12345678-1234-1234-1234-123456789abc';
test('complete public RSA pair reaches the documented SDK settings', () => {
  const settings = culqiRsaSettings({ VITE_CULQI_RSA_ID: id,
    VITE_CULQI_RSA_PUBLIC_KEY: publicKey.replace(/\n/g, '\\n') });
  assert.equal(settings.xculqirsaid, id);
  assert.equal(settings.rsapublickey, publicKey.trim());
});
test('missing, truncated and private keys fail closed', () => {
  for (const key of [undefined, '', '-----BEGIN PUBLIC KEY-----', privateKey]) {
    assert.throws(() => culqiRsaSettings({ VITE_CULQI_RSA_ID: id, VITE_CULQI_RSA_PUBLIC_KEY: key }));
  }
  assert.throws(() => culqiRsaSettings({ VITE_CULQI_RSA_PUBLIC_KEY: publicKey }));
});
test('hosted payment redirect rejects lookalikes, credentials and HTTP', () => {
  assert.equal(isCulqiCheckoutUrl('https://checkout.culqi.com/pay'), true);
  for (const url of [null, 'https://evil.test/culqi.com', 'https://culqi.com.evil.test',
    'https://evilculqi.com', 'http://checkout.culqi.com', 'https://user@culqi.com', 'javascript:alert(1)']) {
    assert.equal(isCulqiCheckoutUrl(url), false);
  }
});
