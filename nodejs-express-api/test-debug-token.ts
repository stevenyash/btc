import crypto from 'crypto';

// Decode server token and figure out the correct signing data
const serverToken = 'FmW2gEruRaYkZE313fDRw4aMAhpV_qbJfOuG-lAvz4w';
const securityKey = 'd5fc29b1-b0f5-4f50-ac5e-8673eaf62bb9';
const videoId = '618ed58e-cd1e-48c3-8d4d-87f677ae5790';
const expires = 1777189800;

console.log('=== Reverse-engineering Bunny token ===');
console.log('Server token:', serverToken);
console.log('Security key:', securityKey);
console.log('Video ID:', videoId);
console.log('Expires:', expires);

// Decode token from Base64URL to hex
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding === 2) base64 += '==';
  else if (padding === 3) base64 += '=';
  const buf = Buffer.from(base64, 'base64');
  return buf.toString('hex');
}

const tokenHex = base64UrlDecode(serverToken);
console.log('\nToken decoded hex:', tokenHex);

// Try different signing data constructions to match this HMAC
console.log('\n=== Testing signing data variations ===');

// Variation 1: HMAC with key, message = urlPath + expires + params with &
const urlPath = `/${videoId}/playlist.m3u8`;
const tokenPath = `/${videoId}/`;
const params1 = `token_ignore_params=1&token_path=${tokenPath}`;
const msg1 = urlPath + expires + params1;
console.log('\n--- Variation 1 (with &) ---');
console.log('Message:', msg1);
const hmac1 = crypto.createHmac('sha256', securityKey);
hmac1.update(msg1);
const token1 = hmac1.digest('base64url');
console.log('Generated token:', token1);
console.log('Match?', token1 === serverToken);

// Variation 2: HMAC with key, message with no separator between params
const params2 = `token_ignore_params=1token_path=${tokenPath}`;
const msg2 = urlPath + expires + params2;
console.log('\n--- Variation 2 (no &) ---');
console.log('Message:', msg2);
const hmac2 = crypto.createHmac('sha256', securityKey);
hmac2.update(msg2);
const token2 = hmac2.digest('base64url');
console.log('Generated token:', token2);
console.log('Match?', token2 === serverToken);

// Variation 3: Include userIp (empty string) explicitly?
const msg3 = urlPath + expires + '' + params1;
console.log('\n--- Variation 3 (with empty userIp) ---');
console.log('Message:', msg3);
const hmac3 = crypto.createHmac('sha256', securityKey);
hmac3.update(msg3);
const token3 = hmac3.digest('base64url');
console.log('Generated token:', token3);
console.log('Match?', token3 === serverToken);

// Variation 4: token_ignore_params as "true" string (not 1)
const params4 = `token_ignore_params=true&token_path=${tokenPath}`;
const msg4 = urlPath + expires + params4;
console.log('\n--- Variation 4 (ignore_params=true) ---');
console.log('Message:', msg4);
const hmac4 = crypto.createHmac('sha256', securityKey);
hmac4.update(msg4);
const token4 = hmac4.digest('base64url');
console.log('Generated token:', token4);
console.log('Match?', token4 === serverToken);

// Variation 5: use token_path URL-encoded in hash?
const params5 = `token_ignore_params=1&token_path=${encodeURIComponent(tokenPath)}`;
const msg5 = urlPath + expires + params5;
console.log('\n--- Variation 5 (URL-encoded token_path) ---');
console.log('Message:', msg5);
const hmac5 = crypto.createHmac('sha256', securityKey);
hmac5.update(msg5);
const token5 = hmac5.digest('base64url');
console.log('Generated token:', token5);
console.log('Match?', token5 === serverToken);

// Variation 6: no token_path at all (just ignore_params)
const params6 = `token_ignore_params=1`;
const msg6 = urlPath + expires + params6;
console.log('\n--- Variation 6 (no token_path) ---');
console.log('Message:', msg6);
const hmac6 = crypto.createHmac('sha256', securityKey);
hmac6.update(msg6);
const token6 = hmac6.digest('base64url');
console.log('Generated token:', token6);
console.log('Match?', token6 === serverToken);

// Variation 7: token_path only (no ignore_params)
const params7 = `token_path=${tokenPath}`;
const msg7 = urlPath + expires + params7;
console.log('\n--- Variation 7 (token_path only) ---');
console.log('Message:', msg7);
const hmac7 = crypto.createHmac('sha256', securityKey);
hmac7.update(msg7);
const token7 = hmac7.digest('base64url');
console.log('Generated token:', token7);
console.log('Match?', token7 === serverToken);
