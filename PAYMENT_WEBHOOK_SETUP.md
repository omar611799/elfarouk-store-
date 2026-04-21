# Payment Webhook Setup

This project now includes a production webhook endpoint:

- `POST /api/payment-webhook`

## Payload format expected

```json
{
  "bookingId": "BOOKING_DOC_ID",
  "status": "success",
  "provider": "paymob",
  "transactionId": "TX123",
  "amount": 50,
  "signature": "hmac_sha256_hex"
}
```

## Signature algorithm

Server verifies:

`HMAC_SHA256(secret, bookingId|status|transactionId|amount)`

- `secret` = `PAYMENT_WEBHOOK_SECRET`

## Required Vercel Environment Variables

- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string of Firebase service account)
- `PAYMENT_WEBHOOK_SECRET` (shared webhook secret with your payment provider)

## How to add FIREBASE_SERVICE_ACCOUNT_KEY

1. Firebase Console -> Project settings -> Service accounts.
2. Generate new private key.
3. Copy the full JSON content.
4. In Vercel -> Project -> Settings -> Environment Variables:
   - Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: paste full JSON as one string.

## Test webhook quickly

You can send a manual test:

```bash
curl -X POST https://your-domain.vercel.app/api/payment-webhook \
  -H "Content-Type: application/json" \
  -d '{"bookingId":"<doc-id>","status":"success","provider":"manual","transactionId":"TEST-1","amount":50,"signature":"<computed-signature>"}'
```

If response is `{ "ok": true }`, payment status auto-updates in Firestore.
