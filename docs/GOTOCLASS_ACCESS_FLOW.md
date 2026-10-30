# GoToClass Access and Usage Flow

This document records the intended GoToClass rules as a reference for implementation. The server is the source of truth for identity, payment, lesson access, package usage, and remaining watch time. Browser state and local storage must not grant access.

## Account types

### Guest account

- The guest's normalized phone number identifies the account.
- If payment processing creates an internal `guest_*` user row, that row remains a guest account; it must not prevent the phone owner from returning to GoToClass.
- Store purchases and remaining lesson watch time on the server against that phone number and lesson.
- Local storage may remember the phone number for convenience, but the server must check the corresponding purchase before granting access.
- A guest purchases one lesson at the configured guest price. Each purchase grants its own configured watch-time allowance for that lesson.
- Only actual playback time reduces the allowance. Pausing, closing, or returning later must not consume time.
- When the purchased allowance reaches zero, the guest must purchase that lesson again to continue watching.
- Do not expire a purchase merely because calendar time passed unless a separate expiry rule is explicitly introduced and shown to the customer.

### Subscriber account

A subscriber can watch through their package while all of the following permit access:

1. The subscription is active and has not expired.
2. The package has an unused lesson slot if this is a new lesson for that subscription.
3. The package has shared watch time remaining.
4. An active device slot is available under the package's concurrent-device limit.

These are independent limits and must be represented and checked independently.

## Subscriber lesson and watch-time accounting

- Count a lesson once per subscription, the first time the subscriber starts that distinct lesson under package access.
- Resuming or replaying a lesson already counted under the same subscription does not consume another lesson slot.
- Every second actually watched reduces the subscription's shared watch-time balance, including time spent replaying a counted lesson.
- A lesson slot is not consumed by a failed stream request or by opening a lesson that never begins playback.
- Record distinct lesson usage with a unique subscription-and-lesson pair so repeated requests cannot count the same lesson twice.
- Keep lesson-slot consumption separate from watch-time deductions; periodic watch-time syncs must never increment the lesson count.

## Device limit

- Enforce the package's configured concurrent-device limit on the server when a playback session starts.
- Track active playback sessions/devices for the subscriber, not merely the number displayed in the UI.
- Release a device slot on clean playback end/close and expire abandoned sessions using a server-side heartbeat timeout.
- Make concurrent session registration atomic so simultaneous requests cannot exceed the package limit.
- Browser device IDs are stored in local storage and can be reset; this provides practical concurrent-session control, not tamper-proof hardware binding.
- A package device limit applies to package playback. An individual lesson grant is separately purchased and does not reserve or consume a package device slot.

## Subscriber individual lesson purchase

When package access is blocked by an exhausted lesson allowance, exhausted shared watch time, or another package condition:

1. Explain which package condition prevents included access.
2. Offer the selected lesson at the configured subsidized subscriber price, along with its watch-time allowance.
3. Grant access only after payment is confirmed by the payment provider/server callback.
4. Store the grant separately from package usage and tie it to the subscriber account and that specific lesson.
5. Do not restore or consume package lesson slots or shared watch time for this one-off grant. Its own playback consumes only its own allowance.
6. Consume only the purchased grant's watch-time allowance; do not reserve a package device slot for the individual playback.

The one-off purchase should follow the same lesson-specific authorization rules as a guest purchase, but retain the authenticated subscriber as its owner and use the subscriber price/duration settings.

## Server-side playback decision

Before issuing a stream URL, the server should:

1. Resolve the authenticated subscriber or normalized guest phone account.
2. Check that the lesson exists and is active.
3. For subscribers, verify the subscription is active and load its package limits and current usage.
4. Determine whether package access is available:
   - Existing distinct lesson or an available lesson slot;
   - Positive shared watch-time balance;
   - Available device slot.
5. If package access is unavailable, check for a valid individual purchase for this exact lesson and account, with remaining purchased watch time.
6. Grant the appropriate access mode, or deny with a machine-readable reason the UI can use to offer purchase, renewal, or device management.
7. Enforce the selected grant's remaining watch time server-side as playback usage is synchronized.

An active subscription by itself must not bypass exhausted package limits. A purchase for one lesson must not authorize other lessons.

## Watch-time synchronization

- Start accounting only when playback is actually playing.
- Sync watched seconds periodically and on pause, playback end, and close.
- Deduct time on the server from the relevant balance: the shared subscription balance for package access, or the lesson-specific grant for individual access.
- Validate positive, bounded increments and clamp deductions to remaining allowance. Add an idempotency/session mechanism before introducing automatic retries.
- Clamp deductions to the remaining balance and stop playback when it reaches zero.
- Never trust a client-provided remaining balance as authoritative.
- Current time capture is based on browser playback events and periodic client syncs. The server validates and clamps deductions, but cannot independently prove actual playback seconds; do not treat this as DRM-grade enforcement.

## Illustrative example

Suppose a package allows 10 distinct lessons, 20 total hours of viewing, and 2 concurrent devices:

- The subscriber starts Biology A: 1 lesson slot is used.
- They watch 30 minutes: 19.5 shared hours remain.
- They resume or replay Biology A: no additional lesson slot is used, but watched time continues to reduce the shared balance.
- They start Biology B: a second lesson slot is used.
- After 10 distinct lessons, they cannot start an eleventh under the package, even if shared time remains. They may buy that specific lesson at the subscriber rate.
- If all 20 hours are used first, included playback stops even if lesson slots remain. They may renew or buy the selected lesson individually.
- If both device slots are active, package playback is blocked on another device. The subscriber may purchase the selected lesson individually and use its separate allowance.

## Implementation status and deployment

- `react-frontend/src/pages/GoToClassPage.tsx` contains the combined subscriber/guest lesson selection and purchase UI.
- `react-frontend/src/components/LessonPurchaseModal.tsx` already distinguishes guest and subscriber pricing.
- `nodejs-express-api/models/packages.ts` stores `no_of_lessons`, `watch_time_minutes`, and `concurrent_access`.
- `nodejs-express-api/models/lessontrack.ts` stores the separate remaining and total shared watch-time seconds.
- `nodejs-express-api/models/subscriptionLessonUsage.ts` enforces one lesson slot per distinct lesson per subscription.
- `nodejs-express-api/models/subscriptionDeviceSession.ts` tracks concurrent playback devices with an expiring heartbeat.
- `nodejs-express-api/middleware/validateLessonAccess.ts` is the stream authorization entry point for package and individual-purchase access.
- `nodejs-express-api/controllers/lessons.ts` records shared subscriber time and handles device sessions.
- `nodejs-express-api/controllers/mpesa.ts` and `nodejs-express-api/controllers/components_data.ts` activate individual purchases and account for their watch-time grants.
- `react-frontend/src/pages/AdminPackagesPage.tsx` configures the package viewing-time allowance in minutes.

Before deploying the code, apply `nodejs-express-api/migrations/20261029_gotoclass_package_limits.sql`. The migration creates `lesson_access_logs` if it is absent, backfills current package viewing-time from the prior lesson-credit × subscribed-duration rule, converts active lesson-track balances to seconds, and initializes distinct lesson/device tables. Verify the migration on a database backup/staging copy before applying it to production.

Package shared watch time is configured in minutes and stored on subscription tracks in seconds. Individual lesson grants receive the configured subscribed or guest lesson-duration allowance, stored and consumed in seconds. Device heartbeats expire after two minutes without activity.

Preview-available lessons retain the existing public-preview behavior and bypass package/device checks. Confirm this policy before changing preview authorization. The current implementation also has no sync idempotency key, so automatic retries should not be added without an accompanying server-side deduplication mechanism.
