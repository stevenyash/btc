import crypto from 'crypto';
import fs from 'fs';

const privateKey = fs.readFileSync('./cloudfront_private_key_rsa.pem', 'utf8');
const policy = JSON.stringify({
  Statement: [{
    Resource: '/test.mp4',
    Condition: {
      DateLessThan: { 'AWS:EpochTime': 9999999999 }
    }
  }]
});

const signer = crypto.createSign('RSA-SHA1');
signer.update(policy);
const signature = signer.sign(privateKey, 'base64');
console.log('Signature:', signature);