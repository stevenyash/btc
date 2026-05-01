import crypto from 'crypto';

const oldSecurityKey = '3f8a3f92-dd08-40fd-a3eb-80e5c9f9e36b';
const serverToken = 'FmW2gEruRaYkZE313fDRw4aMAhpV_qbJfOuG-lAvz4w';
const videoId = '618ed58e-cd1e-48c3-8d4d-87f677ae5790';
const expires = 1777189800;
const tokenPath = `/${videoId}/`;
const urlPath = `/${videoId}/playlist.m3u8`;
const params = `token_ignore_params=1&token_path=${tokenPath}`;

console.log('Testing with OLD security key:', oldSecurityKey);
console.log('Server token:', serverToken);

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding === 2) base64 += '==';
  else if (padding === 3) base64 += '=';
  return Buffer.from(base64, 'base64').toString('hex');
}
console.log('Server token hex:', decodeBase64Url(serverToken));

// Test with plain SHA256 concatenation (the old algorithm)
const message = oldSecurityKey + urlPath + expires + params;
console.log('\nMessage:', message);
const hash = crypto.createHash('sha256').update(message).digest();
const token = hash.toString('base64url');
console.log('Generated token:', token);
console.log('Match?', token === serverToken);

// Also try with HMAC just to be sure
const hmac = crypto.createHmac('sha256', oldSecurityKey);
hmac.update(urlPath + expires + params);
const tokenHmac = hmac.digest('base64url');
console.log('\nHMAC token:', tokenHmac);
console.log('HMAC Match?', tokenHmac === serverToken);
