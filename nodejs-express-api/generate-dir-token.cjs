const crypto = require('crypto');

const securityKey = '3f8a3f92-dd08-40fd-a3eb-80e5c9f9e36b';
const videoId = 'eddebb98-2ae6-4629-80d2-ace876bbba97';
const expires = Math.floor(Date.now() / 1000) + 3600;
const signaturePath = `/${videoId}/`;  // Directory token
const tokenPath = `/${videoId}/`;

// Hash with directory signature + raw token_path in hash
const sortedParams = `token_ignore_params=1&token_path=${tokenPath}`;
const hashString = securityKey + signaturePath + expires + sortedParams;

console.log('Signature Path (directory):', signaturePath);
console.log('Hash String:', hashString);

const hash = crypto.createHash('sha256').update(hashString).digest();
let token = hash.toString('base64')
  .replace(/\n/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

console.log('\nToken:', token);

// Test both URL formats:
// 1. Query param token
const url1 = `https://vz-8217e52e-f0d.b-cdn.net/${videoId}/playlist.m3u8?token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}&token_ignore_params=1`;
console.log('\n=== URL (query param) ===');
console.log(url1);

// 2. Path-based token
const url2 = `https://vz-8217e52e-f0d.b-cdn.net/bcdn_token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}/${videoId}/playlist.m3u8`;
console.log('\n=== URL (path-based) ===');
console.log(url2);
