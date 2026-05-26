# ELFAROUK Store Go-Live Checklist

Use this checklist before running the system in production.

## 1) Security and Access

- [ ] Change admin password and keep it private.
- [ ] Ensure `.env` is never committed to git.
- [ ] Confirm only admin users can access admin pages.
- [ ] Confirm customer users can only access their own data.

## 2) Firebase and Backend

- [ ] Deploy latest Firestore rules.
- [ ] Verify Firestore indexes are healthy (if prompted by console errors).
- [ ] Add SMTP variables for customer email verification.
- [ ] Verify write/read permissions for:
  - [ ] customer booking
  - [ ] customer wallet read
  - [ ] admin wallet adjustment
  - [ ] notifications and chat

## 3) Build and Deployment

- [ ] `npm run lint` completes without errors.
- [ ] `npm run build` completes successfully.
- [ ] Production deployment on Vercel is updated.
- [ ] Verify routes in production:
  - [ ] `/admin-login`
  - [ ] `/customer/login`
  - [ ] `/customer/account`
  - [ ] `/customer/booking`

## 4) Business Flow Tests (End-to-End)

- [ ] Add product/category/supplier.
- [ ] Create invoice and verify stock decreases.
- [ ] Test partial payment and debt tracking.
- [ ] Test return flow and stock restore.
- [ ] Test customer registration/login.
- [ ] Test customer email verification code delivery.
- [ ] Test service booking creation.
- [ ] Test customer location request (WhatsApp with location link).
- [ ] Test admin chat reply and customer notification.
- [ ] Test wallet credit/debit from admin panel.

## 5) Operations and Reliability

- [ ] Define daily closing routine (sales, expenses, debts).
- [ ] Set backup routine (daily/weekly exports).
- [ ] Prepare fallback process for internet outage.
- [ ] Train staff on POS + booking + debt + wallet flow.

## 6) Device and UX Readiness

- [ ] Verify printer and barcode scanner (if used).
- [ ] Confirm logo/favicon/app manifest are correct.
- [ ] Confirm mobile layout for customer pages.
- [ ] Confirm desktop layout for admin pages.

---

## Current Status Notes

- Latest customer login UI is deployed.
- Customer registration now uses real email verification codes.
- Legacy customer login by old phone-based accounts is still supported temporarily.
- Firebase Auth requires password length of 6+.
