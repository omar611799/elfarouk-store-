# Security Phase 2 (Firestore Rules)

This project now includes strict Firestore rules in `firestore.rules`.

## Important

These rules assume you are using **Firebase Authentication** and role claims:

- `request.auth.token.role == "admin"`
- `request.auth.token.role == "customer"`

If you deploy these rules before wiring auth claims in your app/backend, many client requests will be denied.

## Deploy Rules

1. Install Firebase CLI if not installed:
   - `npm i -g firebase-tools`
2. Login:
   - `firebase login`
3. Select project (first time):
   - `firebase use <your-project-id>`
4. Deploy rules:
   - `npm run deploy:rules`

## Required app data fields

To satisfy ownership checks for customers, docs should include these fields:

- `customerAccounts/{id}` includes `uid`
- `serviceBookings/{id}` includes `customerAuthUid`
- `serviceMessages/{id}` includes `customerAuthUid`
- `notifications/{id}` includes `customerAuthUid` for customer-targeted notifications

## Next required implementation

1. Migrate customer login from local PIN verification to Firebase Auth.
2. Add custom claims for admin/customer roles.
3. Update booking/message/notification write payloads to include auth UID fields above.
