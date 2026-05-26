# ELFAROUK Store Final Launch Test Plan

Use this plan before the first real workday.

Goal: confirm that the system is safe to operate in the shop, not just that it builds.

Estimated time: 45 to 60 minutes.

---

## 1) Before You Start

Prepare these first:

- One admin account
- One cashier account
- One new customer test account
- One old customer account if available
- One test product with stock
- Printer ready if invoices will be printed
- Internet connection available

Do not start with real customer data until all checks below pass.

---

## 2) Admin Access Check

1. Open `/admin-login`
2. Login as `admin`
3. Confirm you can open:
   - dashboard
   - products
   - customers
   - POS
   - service bookings
4. Confirm you can see pending customer account approvals

Pass if:

- Admin enters successfully
- Admin-only pages open normally
- No page redirects incorrectly

Fail if:

- Login succeeds but pages are missing
- Cashier-only or customer-only redirects happen by mistake

---

## 3) Cashier Access Check

1. Logout from admin
2. Login with cashier account from `/admin-login`
3. Confirm cashier lands on `/pos`
4. Confirm cashier can:
   - search products
   - add items to cart
   - create invoice
5. Confirm cashier cannot access:
   - reports
   - expenses
   - suppliers
   - service bookings admin

Pass if:

- Cashier can sell
- Cashier is blocked from sensitive admin sections

---

## 4) Product and Stock Check

1. Login as admin
2. Add a test product if needed
3. Confirm stock quantity appears correctly
4. Edit the product
5. Confirm changes save

Pass if:

- Product add/edit works
- Quantity is visible and stable

---

## 5) POS Sale Check

1. Open POS
2. Add one product to cart
3. Enter customer name and phone
4. Complete one cash sale
5. Confirm invoice is created
6. Confirm stock decreases
7. Confirm customer record updates

Pass if:

- Sale completes without errors
- Invoice appears
- Stock decreases correctly

---

## 6) Debt and Payment Check

1. Create a second sale with partial payment
2. Confirm due amount is saved
3. Open invoices or ledger
4. Pay part or all of the debt
5. Confirm remaining due amount changes correctly

Pass if:

- Debt is recorded
- Debt repayment updates invoice and customer totals

---

## 7) Return Flow Check

1. Open an existing invoice
2. Return one item or delete the invoice if that is your flow
3. Confirm stock comes back
4. Confirm totals adjust correctly

Pass if:

- Returned quantity is reflected
- Stock is restored

---

## 8) New Customer Registration Check

1. Open `/customer/login?mode=register`
2. Register a brand-new customer with email and phone
3. Confirm verification code reaches email
4. Complete registration
5. Confirm customer is logged in
6. Confirm account status is waiting for phone verification

Pass if:

- Email code arrives
- Account is created
- Customer is blocked until admin approval

---

## 9) Customer Approval Check

1. Login as admin
2. Open customers page
3. Find the pending account in the verification queue
4. Press `تفعيل الحساب`
5. Ask the customer to refresh and log in again if needed
6. Confirm the customer can now open:
   - `/customer/account`
   - `/service-booking`

Pass if:

- Pending account becomes active
- Customer booking unlocks after approval

---

## 10) Service Booking Check

1. From approved customer account, open `/service-booking`
2. Choose day and slot
3. Submit booking
4. Confirm booking appears in admin bookings page
5. Send a customer message from booking page
6. Reply as admin
7. Confirm notification appears to the customer

Pass if:

- Booking is saved
- Chat works both ways
- Notifications appear

---

## 11) Payment Reality Check

Current status:

- Booking payment is still operationally manual
- Customer can pay by InstaPay or wallet number
- Admin confirms payment manually or through workflow follow-up

Before real launch, decide one of these:

1. Manual payment for now:
   - keep it
   - train staff clearly
   - require payment note or transfer reference

2. Full automated payment later:
   - connect real provider
   - activate webhook flow fully

Pass for current launch if:

- Staff understands that payment confirmation is manual
- Booking is not falsely treated as automatically paid

---

## 12) Wallet Check

1. Open service bookings admin
2. Adjust customer wallet with a small positive amount
3. Confirm customer wallet balance changes
4. Adjust with a small negative amount if your policy allows it
5. Confirm balance remains correct

Pass if:

- Admin wallet adjustment works
- Customer sees updated wallet balance

---

## 13) Printing and Device Check

1. Print one invoice
2. Confirm printer output is readable
3. If barcode scanner is used, test one scan
4. Confirm layout is fine on:
   - desktop admin screen
   - mobile customer screen

Pass if:

- Printer works
- Core pages are usable on actual devices

---

## 14) Internet Outage Fallback

Define what staff should do if internet stops:

- Write the sale manually
- Keep customer phone number
- Record due amounts on paper if needed
- Re-enter data into the system when internet returns

This is not automatic in the app today, so the store should have a manual fallback.

---

## 15) Launch Decision

You are ready for real usage if all these are true:

- Admin login works
- Cashier login works
- POS sale works
- Debt flow works
- Return flow works
- Customer registration works
- Pending approval flow works
- Booking works
- Chat and notifications work
- Wallet adjustment works
- Printer works

If one of the core flows above fails, do not start live sales until it is fixed.

---

## 16) Recommended First-Day Policy

For the first 3 days:

- Keep customer booking payment manual
- Let only one trusted cashier use the system
- Do end-of-day review of:
  - invoices
  - debts
  - stock changes
  - service bookings
  - wallet adjustments

This reduces risk while the team gets comfortable.
