const crypto = require('crypto');

// From server logs - lesson 15 (second attempt, video ID: eddebb98...)
const securityKey = 'd5fc29b1-b0f5-4f50-ac5e-8673eaf62bb9';
const signaturePath = '/eddebb98-2ae6-4629-80d2-ace876bbba97/';
const expires = '1777194418';
const userIp = '::1';

// Hash string components
const hashString = securityKey + signaturePath + expires + userIp + 'token_ignore_params=1&token_path=' + encodeURIComponent(signaturePath);

console.log('Hash string:', hashString);
console.log('Length:', hashString.length);

const hash = crypto.createHash('sha256').update(hashString).digest();
let token = hash.toString('base64').replace(/\n/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

console.log('Generated token:', token);
console.log('Expected token:  I55ARXnWTL6EwBMRzs805LcyRvBD9rUgpD7sYtOwt7Y');
console.log('Match:', token === 'I55ARXnWTL6EwBMRzs805LcyRvBD9rUgpD7sYtOwt7Y');
