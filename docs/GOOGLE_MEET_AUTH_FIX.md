# Google Meet Authentication Error - Fix Guide

## Problem Description

When scheduling a class on Google Meet, you encounter a **Google authentication error**. This happens because the Google Calendar API requires proper OAuth2 authorization to create calendar events with Google Meet links.

## Root Causes

1. **Missing or Expired OAuth Token**: The [`token.json`](../nodejs-express-api/token.json) file may be missing, expired, or invalid
2. **Token Refresh Issues**: The refresh token may have expired or been revoked
3. **Insufficient Scopes**: The OAuth token may not have the required Calendar API scopes
4. **Configuration Mismatch**: Multiple OAuth configurations exist in the project

## Files Involved

- **[`nodejs-express-api/helpers/googleMeet.js`](../nodejs-express-api/helpers/googleMeet.js)** - Google Meet integration helper
- **[`nodejs-express-api/controllers/scheduler.js`](../nodejs-express-api/controllers/scheduler.js)** - Scheduler controller that creates meetings
- **[`nodejs-express-api/credentials.json`](../nodejs-express-api/credentials.json)** - OAuth2 client credentials
- **[`nodejs-express-api/token.json`](../nodejs-express-api/token.json)** - Stored OAuth2 tokens
- **[`nodejs-express-api/googleConfig.js`](../nodejs-express-api/googleConfig.js)** - Alternative OAuth config (for user auth)

## Solution

### Step 1: Verify Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **bits-tutor-connect**
3. Navigate to **APIs & Services > Enabled APIs**
4. Ensure **Google Calendar API** is enabled
5. Navigate to **APIs & Services > Credentials**
6. Verify your OAuth 2.0 Client ID exists

### Step 2: Check OAuth Redirect URIs

In Google Cloud Console, ensure your OAuth 2.0 Client has these redirect URIs:
- `http://localhost:8050/oauthcallback`
- `https://bitstutorconnect.co.ke/oauthcallback`

These must match the URIs in [`credentials.json`](../nodejs-express-api/credentials.json:10-11).

### Step 3: Re-authorize the Application

When you see the authentication error, the console will display an authorization URL. Follow these steps:

1. **Check the server logs** for a message like:
   ```
   ========================================
   GOOGLE AUTHENTICATION REQUIRED
   ========================================
   Please visit this URL to authorize your application:
   https://accounts.google.com/o/oauth2/v2/auth?...
   ========================================
   ```

2. **Copy the authorization URL** from the logs

3. **Open the URL in your browser**

4. **Sign in with the Google account** that should host the meetings (the account that owns the calendar)

5. **Grant the requested permissions**:
   - View and manage your Google Calendar
   - Create and manage calendar events

6. **You'll be redirected** to the callback URL with an authorization code

### Step 4: Create OAuth Callback Endpoint

You need an endpoint to handle the OAuth callback. Add this to your application:

**File**: `nodejs-express-api/controllers/components_data.js` or create a new route file

```javascript
import { exchangeCodeForTokens } from '../helpers/googleMeet.js';

// OAuth callback endpoint
router.get('/oauth2callback', async (req, res) => {
    try {
        const code = req.query.code;
        
        if (!code) {
            return res.status(400).send('Authorization code not provided');
        }
        
        console.log('Received authorization code, exchanging for tokens...');
        
        // Exchange code for tokens
        await exchangeCodeForTokens(code);
        
        console.log('Authorization successful! Tokens saved.');
        
        return res.send(`
            <html>
                <head><title>Authorization Successful</title></head>
                <body>
                    <h1>✅ Authorization Successful!</h1>
                    <p>Google Calendar has been authorized successfully.</p>
                    <p>You can now close this window and try scheduling a class again.</p>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('OAuth callback error:', error);
        return res.status(500).send(`
            <html>
                <head><title>Authorization Failed</title></head>
                <body>
                    <h1>❌ Authorization Failed</h1>
                    <p>Error: ${error.message}</p>
                    <p>Please try again or contact support.</p>
                </body>
            </html>
        `);
    }
});
```

### Step 5: Test the Authorization Flow

1. **Start your server**:
   ```bash
   cd nodejs-express-api
   npm start
   ```

2. **Try to schedule a class** through your frontend

3. **Check the server console** for the authorization URL

4. **Complete the OAuth flow** as described in Step 3

5. **Try scheduling again** - it should now work!

## Improvements Made

### 1. Enhanced Token Refresh ([`googleMeet.js`](../nodejs-express-api/helpers/googleMeet.js:51-67))

Added automatic token refresh listener:
```javascript
client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
        console.log('New refresh token received, saving...');
        saveCredentials(client).catch(err => {
            console.error('Failed to save new tokens:', err);
        });
    }
});
```

### 2. Better Authorization Error Handling ([`googleMeet.js`](../nodejs-express-api/helpers/googleMeet.js:249-310))

- Attempts to refresh expired tokens automatically
- Provides clear, formatted error messages
- Includes the authorization URL in the error message

### 3. Detailed Error Messages ([`googleMeet.js`](../nodejs-express-api/helpers/googleMeet.js:503-540))

Enhanced error handling with specific messages for:
- Authorization errors
- Missing credentials file
- 401 Unauthorized (expired token)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (invalid calendar)

## Troubleshooting

### Error: "Authorization required"

**Solution**: Follow Step 3 to re-authorize the application.

### Error: "Token may be expired or invalid"

**Solution**: 
1. Delete [`token.json`](../nodejs-express-api/token.json)
2. Restart the server
3. Complete the OAuth flow again

### Error: "Permission denied"

**Solution**:
1. Verify Google Calendar API is enabled in Google Cloud Console
2. Check that the OAuth scopes include:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
3. Re-authorize with the correct scopes

### Error: "Credentials file not found"

**Solution**: Ensure [`credentials.json`](../nodejs-express-api/credentials.json) exists in the `nodejs-express-api` directory.

### Error: "Redirect URI mismatch"

**Solution**:
1. Check the redirect URIs in Google Cloud Console
2. Ensure they match the URIs in [`credentials.json`](../nodejs-express-api/credentials.json)
3. Update either the console or the file to match

## Testing Checklist

- [ ] Google Calendar API is enabled in Google Cloud Console
- [ ] OAuth 2.0 Client ID is configured with correct redirect URIs
- [ ] [`credentials.json`](../nodejs-express-api/credentials.json) file exists and is valid
- [ ] OAuth callback endpoint is implemented and accessible
- [ ] Server logs show clear authorization instructions
- [ ] Authorization flow completes successfully
- [ ] [`token.json`](../nodejs-express-api/token.json) is created with refresh_token
- [ ] Scheduling a class creates a Google Meet link successfully
- [ ] Token refresh works automatically when access token expires

## Additional Notes

### Multiple OAuth Configurations

Your project has two OAuth configurations:

1. **[`credentials.json`](../nodejs-express-api/credentials.json)** - Used for Google Calendar/Meet API
   - Client ID: `1082432998207-q6o64s2k39d82m2lmdva8hsclil2jk8p.apps.googleusercontent.com`
   - Used by: [`googleMeet.js`](../nodejs-express-api/helpers/googleMeet.js)

2. **[`googleConfig.js`](../nodejs-express-api/googleConfig.js)** - Used for user authentication
   - Client ID: `511267528651-a0vir63mop32484o6ft62n2i4f2j0pqe.apps.googleusercontent.com`
   - Used by: [`googleAuthMethods.js`](../nodejs-express-api/helpers/googleAuthMethods.js)

**Important**: These are separate OAuth clients for different purposes. Don't mix them up!

### Security Considerations

1. **Never commit [`token.json`](../nodejs-express-api/token.json)** to version control (add to `.gitignore`)
2. **Keep [`credentials.json`](../nodejs-express-api/credentials.json) secure** - it contains your client secret
3. **Use environment variables** for production credentials
4. **Regularly rotate** OAuth client secrets
5. **Monitor** OAuth token usage in Google Cloud Console

### Production Deployment

For production, consider:

1. **Environment Variables**: Store credentials in environment variables instead of files
2. **Secure Storage**: Use a secrets manager (AWS Secrets Manager, Google Secret Manager, etc.)
3. **Service Account**: Consider using a Google Service Account for server-to-server authentication
4. **Error Monitoring**: Implement proper error tracking (Sentry, LogRocket, etc.)
5. **Rate Limiting**: Implement rate limiting for the OAuth callback endpoint

## Related Documentation

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Meet API](https://developers.google.com/meet)
- [Project Analysis: GOOGLE_SCHEDULER_ANALYSIS.md](./GOOGLE_SCHEDULER_ANALYSIS.md)

## Support

If you continue to experience issues:

1. Check the server logs for detailed error messages
2. Verify all steps in this guide have been completed
3. Review the [Google Calendar API Troubleshooting Guide](https://developers.google.com/calendar/api/guides/troubleshooting)
4. Contact your system administrator or development team

---

**Last Updated**: 2026-02-03  
**Author**: Kilo Code  
**Version**: 1.0
