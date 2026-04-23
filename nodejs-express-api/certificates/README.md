# M-Pesa Certificate Setup for B2C Withdrawals

## Security Credential Configuration

The `SECURITY_CREDENTIAL` in `mpesaconfig.js` is required for B2C transfers (withdrawals).

### Option 1: Set Security Credential Directly

If you already have the security credential from Safaricom:

1. Open `mpesaconfig.js`
2. Set `SECURITY_CREDENTIAL` to your value:
```javascript
SECURITY_CREDENTIAL: "your_security_credential_here",
```

### Option 2: Generate Security Credential from Certificate

1. Download the M-Pesa public certificate from Safaricom Developer Portal:
   - Go to https://developer.safaricom.co.ke/
   - Navigate to your app
   - Download the certificate (usually named `cert.cer` or `cert.pem`)

2. Place the certificate file in this folder (`certificates/`)

3. Rename it to `safaricom_cert.pem` or update `CERTIFICATE_PATH` in `mpesaconfig.js`

4. Restart the server - the security credential will be generated automatically

### How Security Credential is Generated

The security credential is created by:
1. Taking the initiator usercode (set in `INITusercode` in mpesaconfig.js)
2. Encrypting it with the M-Pesa public certificate
3. Using RSA PKCS1 padding

The encrypted result is used in B2C API calls.

### Troubleshooting

**Error: "Security credential not configured"**
- Ensure the certificate file exists at the configured path
- Check that `INITusercode` is set correctly in mpesaconfig.js
- Verify the certificate is in PEM format

**B2C Transfer Fails**
- Confirm the initiator name matches what's registered on Safaricom portal
- Verify the shortcode is correct (4140371)
- Ensure the API credentials (APP_KEY, APP_SECRET) are valid
- Check that B2C is enabled for your app on Safaricom portal

### Production Checklist

- [ ] M-Pesa certificate downloaded and placed in this folder
- [ ] `SECURITY_CREDENTIAL` generated or set manually
- [ ] `INITIATOR_NAME` matches Safaricom portal registration
- [ ] `app.url` in config.js is set to production URL (for callbacks)
- [ ] B2C API is enabled on Safaricom developer portal
- [ ] Sufficient funds in M-Pesa account for withdrawals
