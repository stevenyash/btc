import crypto from 'crypto';

const serverToken = 'iM04epw0yMTTq3T0oOT6EV5zbLIp7zLqlJEHuq0WvvE';
const securityKey = 'd5fc29b1-b0f5-4f50-ac5e-8673eaf62bb9';
const videoId = '618ed58e-cd1e-48c3-8d4d-87f677ae5790';
const expires = 1777192691;
const tokenPath = `/${videoId}/`;

console.log('=== Reverse-engineering fresh server token ===');
console.log('Token:', serverToken);
console.log('Security key:', securityKey);

// Decode token from Base64URL to hex
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding === 2) base64 += '==';
  else if (padding === 3) base64 += '=';
  return Buffer.from(base64, 'base64').toString('hex');
}

const tokenHex = base64UrlDecode(serverToken);
console.log('Token hex:', tokenHex);

// Try to figure out the signing data structure
// According to Bunny docs (from web search):
// "token = HS256- + Base64URL( HMAC-SHA256(securityKey, signature_path + expires + sorted_params) )"
// where sorted_params are concatenated as key=value pairs (no & separator?) Let's test both

// The URL structure from logs:
// token=HS256-...&expires=1777192691&token_path=%2F618ed58e-cd1e-48c3-8d4d-87f677ae5790%2F&token_ignore_params=1
// So params in URL: token_path (URL-encoded) and token_ignore_params=1

// In the HASH, token_path should be RAW: /618ed58e-cd1e-48c3-8d4d-87f677ae5790/
// token_ignore_params should be numeric 1

console.log('\n=== Testing signing data variations ===');

// Variation 1: HMAC with signaturePath = file path, params concatenated with &
const urlPath = `/${videoId}/playlist.m3u8`;
const paramsWithAmp = `token_ignore_params=1&token_path=${tokenPath}`;
const msg1 = urlPath + expires + paramsWithAmp;
console.log('\n--- HMAC + & separator ---');
console.log('Signing data:', msg1);
const hmac1 = crypto.createHmac('sha256', securityKey);
hmac1.update(msg1);
const token1 = hmac1.digest('base64url');
console.log('Generated:', token1);
console.log('Match?', token1 === serverToken);

// Variation 2: HMAC with params concatenated without & (just key=value pairs)
const paramsNoAmp = `token_ignore_params=1token_path=${tokenPath}`;
const msg2 = urlPath + expires + paramsNoAmp;
console.log('\n--- HMAC no separator ---');
console.log('Signing data:', msg2);
const hmac2 = crypto.createHmac('sha256', securityKey);
hmac2.update(msg2);
const token2 = hmac2.digest('base64url');
console.log('Generated:', token2);
console.log('Match?', token2 === serverToken);

// Variation 3: Use tokenPath as signaturePath (directory token)
const msg3 = tokenPath + expires + paramsWithAmp;
console.log('\n--- HMAC with signaturePath=tokenPath ---');
console.log('Signing data:', msg3);
const hmac3 = crypto.createHmac('sha256', securityKey);
hmac3.update(msg3);
const token3 = hmac3.digest('base64url');
console.log('Generated:', token3);
console.log('Match?', token3 === serverToken);

// Variation 4: Plain SHA256 (key concatenated) with & separator
const msg4 = securityKey + urlPath + expires + paramsWithAmp;
console.log('\n--- Plain SHA256 (key concat) ---');
console.log('Signing data:', msg4);
const hash4 = crypto.createHash('sha256').update(msg4).digest();
const token4 = hash4.toString('base64url');
console.log('Generated:', token4);
console.log('Match?', token4 === serverToken);

// Variation 5: HMAC but signaturePath includes trailing slash? Already has it.
// Variation 6: What if params are sorted differently? Alphabetically: token_ignore_params (i) then token_path (p). Correct.

// Let's also try: maybe token_ignore_params should be "true" not "1"
const paramsTrue = `token_ignore_params=true&token_path=${tokenPath}`;
const msg5 = urlPath + expires + paramsTrue;
console.log('\n--- token_ignore_params=true ---');
console.log('Signing data:', msg5);
const hmac5 = crypto.createHmac('sha256', securityKey);
hmac5.update(msg5);
const token5 = hmac5.digest('base64url');
console.log('Generated:', token5);
console.log('Match?', token5 === serverToken);

// Variation 7: token_ignore_params not included in hash at all? (Bunny docs say it is)
// Let's test without token_ignore_params
const msg6 = urlPath + expires + `token_path=${tokenPath}`;
console.log('\n--- No token_ignore_params ---');
console.log('Signing data:', msg6);
const hmac6 = crypto.createHmac('sha256', securityKey);
hmac6.update(msg6);
const token6 = hmac6.digest('base64url');
console.log('Generated:', token6);
console.log('Match?', token6 === serverToken);

// Variation 8: maybe the order of params in hash should be token_path FIRST then token_ignore_params?
// Alphabetical says ignore_params (i) before path (p). But let's test reverse order just in case
const msg7 = urlPath + expires + `token_path=${tokenPath}token_ignore_params=1`;
console.log('\n--- Reverse param order ---');
console.log('Signing data:', msg7);
const hmac7 = crypto.createHmac('sha256', securityKey);
hmac7.update(msg7);
const token7 = hmac7.digest('base64url');
console.log('Generated:', token7);
console.log('Match?', token7 === serverToken);
