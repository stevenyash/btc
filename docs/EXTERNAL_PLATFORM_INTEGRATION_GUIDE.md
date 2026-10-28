# Bits Hustle Hubs (B2H) Partner Integration Guide

Connect your platform to the B2H ambassador referral program so ambassadors are credited when users they refer sign up or complete qualifying actions on your platform. This guide covers what your platform needs to send to B2H and what it should do with what B2H sends back.

## 1. Overview

| Step | What you do | Endpoint |
| :-: | --- | --- |
| 1 | Look up your platform and see which actions are approved | `GET /api/platforms/me`, `GET /api/platform-actions` |
| 2 | Register the actions that should earn commissions | `POST /api/platform-actions/register` |
| 3 | After approval, set a referral rate per action | `POST /api/referral-rates` |
| 4 | Optional: register a webhook URL to receive B2H events | `PUT /api/platforms/me/webhook-url` |
| 5 | Send a signed conversion event for each referred signup or purchase | `POST /api/webhooks/external-conversion` |

## 2. Before You Start

Get these three values from your B2H administrator:

- Your **platform UUID**
- An active **API key**
- Your platform's **webhook secret**

Keep the API key and webhook secret in a server-side secret manager or environment variables. Never commit them to source control or ship them to browsers or mobile apps, and use them only for the platform they were issued to.

The partner configuration index lists the action names and example commission rates for your platform.

## 3. Conventions

**Base URL:** `https://api.bitshustlehubs.co.ke`. Send requests from your server and include the `/api` prefix shown in each endpoint below. Contact support if you need a non-production environment.

**Response format.** Every response uses the same envelope:

```json
{ "success": true, "message": "rate saved", "data": { } }
```

Errors return `"success": false` with a `message`. List endpoints put `items`, `total`, `page` and `pages` inside `data`.

**Request limits.** Keep setup calls (`platform-actions/register`, `referral-rates`) under 60 requests per minute and conversion events under 100 requests per minute. If you receive `429`, wait for the number of seconds in `retry_after`, then retry with exponential backoff.

## 4. Authentication

### API key

Send your key on setup calls:

```http
X-API-Key: <your-api-key>
```

Each key carries scopes. New keys get `actions:create`, `rates:create` and `rates:update`.

| Scope | Needed for |
| --- | --- |
| `actions:create` | `POST /api/platform-actions/register` |
| `rates:create` | `POST /api/referral-rates` |
| `rates:update` | `POST /api/referral-rates`, `DELETE /api/referral-rates/<id>` |
| `rates:read` | `GET /api/referral-rates` |

`GET /api/platforms/me` and `PUT /api/platforms/me/webhook-url` need a valid key but no particular scope. Ask your administrator for only the scopes you need.

### Signing conversion events

Conversion events are authenticated by signature instead of API key. Compute an HMAC-SHA256 of the canonical JSON of your payload using your webhook secret, and send it in a header:

```http
X-Webhook-Signature: <hmac-sha256-hex>
```

Canonical JSON means keys sorted alphabetically with compact separators (`,` and `:`) and no extra whitespace. Sign the exact payload you send, and leave the signature out of the signed data. See the code in section 11.

## 5. Look Up Your Platform and Actions

```http
GET /api/platforms
GET /api/platforms/me
GET /api/platform-actions?platform_id=<your-platform-uuid>
```

- `GET /api/platforms` lists registered B2H platforms and needs no authentication.
- `GET /api/platforms/me` returns your platform record (including your UUID) and needs your API key. It does not return your webhook secret.
- `GET /api/platform-actions` lists approved, active actions, needs no authentication, and can be filtered by `platform_id`. Actions awaiting approval are not listed, so ask your administrator about their status.

## 6. Register Your Actions

Register every action on your platform that should earn a commission, for example `SUBSCRIPTION_SIGNUP`, `BORROW_FROM_LIBRARY` or `BOOK_SESSION`. A B2H admin must approve each action before you can set a rate for it or use it in conversion events, so only send events for approved actions. Action names must be unique within your platform, and may match names used by other platforms.

```http
POST /api/platform-actions/register
Content-Type: application/json
X-API-Key: <your-api-key>
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | Yes | Machine-readable identifier, e.g. `BOOK_SESSION` |
| `display_name` | string | Yes | Human-readable name |
| `description` | string | No | What the action represents |
| `sortOrder` | integer | No | Display order, default 0 |

```bash
curl -X POST https://api.bitshustlehubs.co.ke/api/platform-actions/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $B2H_API_KEY" \
  -d '{
    "name": "START_TUTORING_SESSION",
    "display_name": "Start Tutoring Session",
    "description": "User completes their first tutoring session"
  }'
```

The `201` response returns the action with `is_approved: false` and `is_active: false`. Once an admin approves it, both become `true`, and if you have registered a webhook URL (section 8) you receive an `action.approved` event.

## 7. Configure Referral Rates

Once an action is approved, set the ambassador reward for it. A rate is either a fixed KES amount per conversion or a percentage of the transaction amount.

```http
POST /api/referral-rates
Content-Type: application/json
X-API-Key: <your-api-key>
```

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `platform_id` | UUID | No | Your platform | Filled in automatically from your key if omitted |
| `tier` | string | No | `DEFAULT` | Ambassador tier; `DEFAULT` is the global rate |
| `action` | string | No | `CONVERSION` | An approved action name for your platform |
| `rate` | number | Yes |  | KES amount, or percent if `is_percentage` is true |
| `is_percentage` | boolean | No | `false` | If true, `rate` is a percentage and cannot exceed 100 |

**Fixed (KES 50 per borrow):**

```bash
curl -X POST https://api.bitshustlehubs.co.ke/api/referral-rates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $B2H_API_KEY" \
  -d '{"tier": "DEFAULT", "action": "BORROW_FROM_LIBRARY", "rate": 50.0}'
```

**Percentage (8% of session fee):**

```bash
curl -X POST https://api.bitshustlehubs.co.ke/api/referral-rates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $B2H_API_KEY" \
  -d '{"tier": "DEFAULT", "action": "BOOK_SESSION", "rate": 8.0, "is_percentage": true}'
```

For percentage rates the reward is `amount × rate / 100`, using the `amount` you send in the conversion event. For example, an amount of 2500 at 8% gives KES 200.

To list your rates, call `GET /api/referral-rates?platform_id=<your-platform-uuid>` (needs `rates:read`, `rates:create` or `rates:update`). To disable one, call `DELETE /api/referral-rates/<rate_id>` (needs `rates:update`). Deleting soft-deletes the rate.

## 8. Set a Webhook URL (Optional)

If you want B2H to notify you when an action is approved or a commission is paid, register an endpoint on your platform:

```http
PUT /api/platforms/me/webhook-url
Content-Type: application/json
X-API-Key: <your-api-key>
```

```json
{ "webhook_url": "https://your-platform.com/webhooks/bitshustle" }
```

Use an HTTPS URL in production. Section 10 explains how to receive and verify what B2H sends.

## 9. Report Conversions

When a user who arrived through an ambassador's referral signs up or completes a paid action, send B2H a conversion event right away so the ambassador is credited.

```http
POST /api/webhooks/external-conversion
Content-Type: application/json
X-Webhook-Signature: <hmac-sha256-hex>
```

### Choosing PENDING or CONVERTED

| Your platform | `conversion_status` | `amount` | Send when |
| --- | --- | --- | --- |
| Free signup | `PENDING` | omit | The user signs up through a referral |
| Free signup | `CONVERTED` | required | The user later completes a paid action |
| Paid subscription | `CONVERTED` | required | On signup, because payment is the conversion |

### Payload fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `referral_code` | string | Yes | The ambassador's code, e.g. `AMB123_REF` (or send `referral_id` instead) |
| `action` | string | Yes | An approved, active action for your platform, e.g. `BOOK_SESSION` |
| `platform_id` | UUID | Yes | Your platform UUID |
| `event_id` | string | Yes | Unique ID for this event, 1 to 128 characters (see below) |
| `conversion_status` | string | Yes | `PENDING` or `CONVERTED` |
| `amount` | number | For `CONVERTED` | Finite transaction amount in KES, greater than zero. Optional for `PENDING` |
| `timestamp` | string | Yes | ISO 8601 UTC time you send the request, e.g. `2026-06-05T06:00:00Z` |
| `external_user_id` | string | Yes | The user's unique ID on your platform |
| `email` | string | One of email or phone | User's email |
| `email_verified` | boolean | With email | `true` only if you have verified the email |
| `phone` | string | One of email or phone | User's phone number |
| `phone_verified` | boolean | With phone | `true` only if you have verified the phone |
| `converted_at` | string | No | ISO 8601 UTC time the conversion happened |
| `name` | string | No | User's full name |

### Timestamps

Generate `timestamp` at the moment you send, from a clock synced to UTC. Events whose timestamp is more than 5 minutes (300 seconds) away from B2H's time are rejected, so regenerate the timestamp (and the signature) on every retry.

### Event IDs and retries

`event_id` must be a stable ID from your own system, such as a transaction ID or signup ID. B2H scopes IDs to your platform.

- **Retrying the same event** (for example after a timeout): reuse the same `event_id` and the same data. No second commission is issued.
- **A new purchase or recurring payment**: use a new `event_id`, even if the referral has already converted.
- Never invent a fresh ID just to retry. Never reuse an ID with different data, as that is rejected.
- If you receive `409 already processed`, the conversion is already recorded. Treat it as complete.

### Examples

**Signup on a free platform (PENDING):**

```json
{
  "referral_code": "AMB123_REF",
  "action": "USER_SIGNUP",
  "platform_id": "b552099e-987c-4109-bdc8-8b7600600752",
  "event_id": "signup-tc_user_456",
  "conversion_status": "PENDING",
  "timestamp": "2026-06-05T06:00:00Z",
  "external_user_id": "tc_user_456",
  "email": "user@example.com",
  "email_verified": true
}
```

**Paid session (CONVERTED, KES 2,500):**

```json
{
  "referral_code": "AMB123_REF",
  "action": "BOOK_SESSION",
  "platform_id": "b552099e-987c-4109-bdc8-8b7600600752",
  "event_id": "payment-txn-789",
  "conversion_status": "CONVERTED",
  "amount": 2500.00,
  "converted_at": "2026-06-05T06:00:00Z",
  "timestamp": "2026-06-05T06:00:00Z",
  "external_user_id": "tc_user_456",
  "email": "student@example.com",
  "email_verified": true
}
```

## 10. Receive B2H Webhooks (Optional)

If you registered a webhook URL, B2H sends events to it, signed with your webhook secret.

| Header | Meaning |
| --- | --- |
| `X-B2H-Event` | The event type |
| `X-B2H-Signature` | HMAC-SHA256 hex of the exact raw request body |

| Event | Sent when | `data` |
| --- | --- | --- |
| `action.approved` | An admin approves an action you registered | `{ id, name, display_name, is_approved, ... }` |
| `commission.paid` | An ambassador's wallet is credited for a referral | `{ referral_id, amount, currency }` |

```json
{
  "event_type": "commission.paid",
  "platform_id": "b552099e-987c-4109-bdc8-8b7600600752",
  "timestamp": "2026-06-05T06:00:00Z",
  "data": { "referral_id": "uuid-here", "amount": 200.0, "currency": "KES" }
}
```

In your handler:

1. Read the raw request body before parsing it.
2. Compute HMAC-SHA256 of the raw body with your webhook secret.
3. Compare it to `X-B2H-Signature` using a constant-time comparison (`hmac.compare_digest` in Python, `crypto.timingSafeEqual` in Node.js). Reject the request if it does not match.
4. Check that `timestamp` is within 5 minutes of your current time, to guard against replays.
5. Branch on `X-B2H-Event` and process the event.

## 11. Code Examples

These run on your server. Replace the sample actions and IDs with your own.

### Signing and sending a conversion (Python)

```python
import os, hmac, hashlib, json, requests
from datetime import datetime, timezone

B2H_BASE = "https://api.bitshustlehubs.co.ke"
WEBHOOK_SECRET = os.environ["B2H_WEBHOOK_SECRET"]
PLATFORM_ID = os.environ["B2H_PLATFORM_ID"]

def sign_payload(payload: dict, secret: str) -> str:
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    return hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()

def now_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def send_conversion(referral_code, event_id, action, status="CONVERTED",
                    amount=None, **user_fields):
    payload = {
        "referral_code": referral_code,
        "event_id": event_id,
        "action": action,
        "platform_id": PLATFORM_ID,
        "conversion_status": status,
        "timestamp": now_utc(),
        **user_fields,
    }
    if amount is not None:
        payload["amount"] = amount
        payload["converted_at"] = payload["timestamp"]
    # Sign exactly what is sent, then serialize the same way
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    sig = hmac.new(WEBHOOK_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return requests.post(
        f"{B2H_BASE}/api/webhooks/external-conversion",
        data=body,
        headers={"Content-Type": "application/json", "X-Webhook-Signature": sig},
        timeout=10,
    )

send_conversion(
    "AMB123_REF", "payment-txn-789", "BOOK_SESSION", amount=2500.00,
    external_user_id="tc_user_456",
    email="student@example.com", email_verified=True,
)
```

### Signing a conversion (Node.js)

```javascript
import crypto from 'crypto';

function canonicalize(payload) {
  // Flat payloads only: sort keys, then serialize compactly
  const sorted = Object.fromEntries(
    Object.keys(payload).sort().map((k) => [k, payload[k]])
  );
  return JSON.stringify(sorted);
}

function signPayload(payload, secret) {
  return crypto.createHmac('sha256', secret).update(canonicalize(payload)).digest('hex');
}

// Send canonicalize(payload) as the request body so it matches what you signed.
```

### Registering actions and setting rates (Python)

```python
HEADERS = {"X-API-Key": os.environ["B2H_API_KEY"], "Content-Type": "application/json"}

requests.post(f"{B2H_BASE}/api/platform-actions/register", headers=HEADERS, json={
    "name": "BOOK_SESSION", "display_name": "Book a Session",
    "description": "User books a paid tutoring session",
})

# After an admin approves the action:
requests.post(f"{B2H_BASE}/api/referral-rates", headers=HEADERS, json={
    "tier": "DEFAULT", "action": "BOOK_SESSION",
    "rate": 8.0, "is_percentage": True,
})
```

### Receiving B2H webhooks (Python/Flask)

```python
from flask import Flask, request, abort
import os, hmac, hashlib, json

app = Flask(__name__)
WEBHOOK_SECRET = os.environ["B2H_WEBHOOK_SECRET"]

@app.route("/webhooks/bitshustle", methods=["POST"])
def handle_b2h_webhook():
    raw = request.get_data()
    expected = hmac.new(WEBHOOK_SECRET.encode(), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(request.headers.get("X-B2H-Signature", ""), expected):
        abort(401)

    event = json.loads(raw)
    kind = request.headers.get("X-B2H-Event", "")
    if kind == "action.approved":
        print("Action approved:", event["data"]["name"])
    elif kind == "commission.paid":
        print("Commission paid:", event["data"]["amount"], event["data"]["currency"])
    return "", 200
```

## 12. Status Codes

| Code | Meaning | What to do |
| --- | --- | --- |
| 200 / 201 | Success or created | Continue |
| 400 | Invalid payload: missing fields, bad format, missing `referral_code` or `referral_id`, missing `external_user_id`, or no verified email or phone | Fix the request; do not retry unchanged |
| 401 | Missing, invalid or revoked API key, or missing or invalid webhook signature | Check your key, secret and canonical JSON; make sure you sign the exact payload you send |
| 403 | API key lacks the required scope | Ask your administrator for the scope |
| 404 | Platform, action, rate or referral code not found | Check the IDs and codes you are sending |
| 409 | Conversion already processed | Treat as complete; do not resend as a new event |
| 429 | Too many requests | Wait `retry_after` seconds, then back off exponentially |
| 500 | Server error | Retry with the same `event_id`; contact support if it persists |

## 13. Testing

Test only with the credentials and referral code B2H gives you for that purpose. Do not send made-up or invalid conversion events to production, because a conversion can credit an ambassador.

To check your setup, list your approved actions with `GET /api/platform-actions?platform_id=<your-platform-uuid>` and your rates with `GET /api/referral-rates?platform_id=<your-platform-uuid>` (the second needs your API key).

## 14. Security Checklist

- Keep credentials server-side (section 2) and use HTTPS everywhere.
- Sign every conversion event and verify every B2H webhook (sections 4 and 10).
- Request only the API key scopes you need.
- Back off on `429` and handle `409` as already complete (sections 3 and 9).
- Log the outcome of each webhook you send or receive, for debugging and auditing.

## 15. Lost Credentials and Support

- **Lost or compromised API key:** contact your B2H admin right away, request a replacement with the scopes you need, update your integration, and confirm when the old key can be revoked.
- **Lost webhook secret:** ask your admin to rotate it, coordinate the change with your team, then update both your signing and your verification code.
- **Forgot your platform UUID:** call `GET /api/platforms/me` or `GET /api/platforms`.

**Support:** support@bitshustlehubs.co.ke. Include your platform name, the endpoint or webhook involved, the exact error message, and a redacted copy of the request and response.
