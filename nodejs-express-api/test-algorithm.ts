import crypto from 'crypto';

const serverToken = 'FmW2gEruRaYkZE313fDRw4aMAhpV_qbJfOuG-lAvz4w';
const securityKey = 'd5fc29b1-b0f5-4f50-ac5e-8673eaf62bb9';
const videoId = '618ed58e-cd1e-48c3-8d4d-87f677ae5790';
const expires = 1777189800;
const tokenPath = `/${videoId}/`;

console.log('Server token:', serverToken);

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding === 2) base64 += '==';
  else if (padding === 3) base64 += '=';
  return Buffer.from(base64, 'base64').toString('hex');
}
console.log('Server token hex:', decodeBase64Url(serverToken));

// Variation A: Plain SHA256 of concatenated string (securityKey + path + expires + params)
// This is what the doc snippet suggested: SHA256_RAW(token_security_key + signed_url + expiration + ...)
const urlPath = `/${videoId}/playlist.m3u8`;
const params = `token_ignore_params=1&token_path=${tokenPath}`;
const messageA = securityKey + urlPath + expires + params;
console.log('\n=== Plain SHA256 (securityKey concat) ===');
console.log('Message:', messageA);
const hashA = crypto.createHash('sha256').update(messageA).digest();
const tokenA = hashA.toString('base64url');
console.log('Token:', tokenA);
console.log('Match?', tokenA === serverToken);

// Variation B: Signature path uses tokenPath instead of file path (directory token)
const messageB = securityKey + tokenPath + expires + params;
console.log('\n=== Plain SHA256 with signaturePath=tokenPath ===');
console.log('Message:', messageB);
const hashB = crypto.createHash('sha256').update(messageB).digest();
const tokenB = hashB.toString('base64url');
console.log('Token:', tokenB);
console.log('Match?', tokenB === serverToken);

// Variation C: HMAC-SHA256(securityKey, securityKey+path+expires+params) - key as HMAC key
const hmacC = crypto.createHmac('sha256', securityKey);
hmacC.update(messageA);
const tokenC = hmacC.digest('base64url');
console.log('\n=== HMAC-SHA256 (key as HMAC key) ===');
console.log('Token:', tokenC);
console.log('Match?', tokenC === serverToken);

// Variation D: securityKey + tokenPath + expires + params (no URLPath at all)
const messageD = securityKey + tokenPath + expires;
const hashD = crypto.createHash('sha256').update(messageD).digest();
const tokenD = hashD.toString('base64url');
console.log('\n=== Plain SHA256: securityKey+tokenPath+expires (no params) ===');
console.log('Message:', messageD);
console.log('Token:', tokenD);
console.log('Match?', tokenD === serverToken);
