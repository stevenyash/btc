const crypto = require('crypto');

const securityKey = '3f8a3f92-dd08-40fd-a3eb-80e5c9f9e36b';
const videoId = 'eddebb98-2ae6-4629-80d2-ace876bbba97';
const expires = Math.floor(Date.now() / 1000) + 3600;
const signaturePath = `/${videoId}/playlist.m3u8`;
const tokenPath = `/${videoId}/`;

// Bunny's OFFICIAL algorithm (from their examples):
// hash = securityKey + urlPath + expires + [optional: userIp] + sortedParams
// where sortedParams values are URL-encoded

const sortedParams = `token_ignore_params=1&token_path=${encodeURIComponent(tokenPath)}`;
const hashString = securityKey + signaturePath + expires + sortedParams;

console.log('Security Key:', securityKey);
console.log('Signature Path:', signaturePath);
console.log('Expires:', expires);
console.log('Sorted Params:', sortedParams);
console.log('Hash String:', hashString);
console.log('Hash String Length:', hashString.length);

// Generate SHA256 hash
const hash = crypto.createHash('sha256').update(hashString).digest();
let token = hash.toString('base64')
  .replace(/\n/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

console.log('\n=== TOKEN (no HS256 prefix) ===');
console.log('Token:', token);

// Build full URL
const baseUrl = `https://vz-8217e52e-f0d.b-cdn.net/${videoId}/playlist.m3u8`;
const fullUrl = `${baseUrl}?token=${token}&expires=${expires}&token_path=${encodeURIComponent(tokenPath)}&token_ignore_params=1`;

console.log('\n=== FULL URL ===');
console.log(fullUrl);
console.log('\n=== CURL COMMAND ===');
console.log(`curl "${fullUrl}" -I`);
